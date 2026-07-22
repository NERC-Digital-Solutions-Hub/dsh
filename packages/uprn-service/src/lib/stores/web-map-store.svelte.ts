import { browser } from '$app/environment';
import { asset } from '$app/paths';
import type { IWebMapService } from '$lib/services/i-web-map-service.js';
import {
	cleanupUprnWebMapLayerResources,
	createWebMapFromJson
} from '$lib/services/web-map/web-map-json-loader';
import { arcgisImport } from '@dsh/common/arcgis';
import { getSublayerId } from '$lib/utilities/treeview-utilities';
import { SvelteMap } from 'svelte/reactivity';

const WEBMAP_LOAD_TIMEOUT_MS = 20000;
let defaultPortalUrl: string | null = null;

export type WebMapPortalItemSource = {
	kind: 'portal-item';
	itemId: string;
	portalUrl?: string | null;
};

export type WebMapJsonUrlSource = {
	kind: 'webmap-json-url';
	url: string;
	portalUrl?: string | null;
	credentials?: RequestCredentials;
};

export type WebMapSource = WebMapPortalItemSource | WebMapJsonUrlSource;

export type WebMapStoreParams = {
	source: WebMapSource;
	proxy?: Proxy | null;
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
};

/**
 * Store for managing the webmap.
 */
export class WebMapStore implements IWebMapService {
	public isLoaded: boolean = $state(false);
	public data: __esri.WebMap | null = $state<__esri.WebMap | null>(null);
	public dataLookup: SvelteMap<string, __esri.Layer | __esri.Sublayer> = $derived.by(() => {
		const map = new SvelteMap<string, __esri.Layer | __esri.Sublayer>();
		function addLayerRecursively(layer: __esri.Layer | __esri.Sublayer) {
			const layerId =
				layer.type === 'sublayer' ? getSublayerId(layer, layer.parent as __esri.Layer) : layer.id;

			map.set(layerId, layer);
			if (layer.type === 'group') {
				const groupLayer = layer as __esri.GroupLayer;
				groupLayer.layers.forEach((lyr) => {
					addLayerRecursively(lyr);
				});
			}

			if (layer.type === 'map-image') {
				const mapImageLayer = layer as __esri.MapImageLayer;
				mapImageLayer.sublayers?.forEach((sublayer) => {
					addLayerRecursively(sublayer);
				});
			}
		}
		if (this.data) {
			this.data.layers.forEach((layer) => {
				addLayerRecursively(layer);
			});
		}
		return map;
	});
	public loading: boolean = $state<boolean>(false);
	public error: string | null = $state<string | null>(null);

	/**
	 * Incremented whenever a lazily-loaded (parquet) layer finishes hydrating and is
	 * swapped into the map. Reactive consumers can depend on this to re-apply
	 * layer-targeted state (e.g. custom renderers) against the live hydrated layer
	 * rather than the discarded placeholder it was created as.
	 */
	public hydrationVersion: number = $state<number>(0);

	private readonly source: WebMapSource;
	private readonly proxy: Proxy | null;
	private appliedPortalUrl: string | null = null;
	private isDestroyed = false;
	private loadGeneration = 0;

	constructor(params: WebMapStoreParams) {
		this.source = params.source;
		this.proxy = params.proxy ?? null;

		if (!browser) {
			return;
		}

		void this.loadAsync();
	}

	/**
	 * Retrieves a layer by its ID.
	 * @param layerId The layer ID.
	 * @return The layer or sublayer with the specified ID, or null if not found.
	 */
	public getLayerById(layerId: string): __esri.Layer | __esri.Sublayer | null {
		return findLayerById(this.data?.layers, layerId) ?? this.dataLookup.get(layerId) ?? null;
	}

	/**
	 * Loads the configured webmap source.
	 */
	public async loadAsync(): Promise<void> {
		if (this.isDestroyed || this.data || this.loading) {
			return;
		}

		const currentLoadGeneration = ++this.loadGeneration;
		this.loading = true;
		this.error = null;
		this.isLoaded = false;

		try {
			console.info('[uprn/webmap-store] Loading web map source', {
				source: describeWebMapSource(this.source)
			});

			await this.configurePortalAsync(this.source.portalUrl, this.proxy);

			if (!this.isCurrentLoad(currentLoadGeneration)) {
				return;
			}

			if (this.source.kind === 'portal-item') {
				await this.loadPortalWebmapAsync(this.source.itemId);
			} else {
				await this.loadWebmapJsonUrlAsync(this.source);
			}

			if (!this.isCurrentLoad(currentLoadGeneration)) {
				return;
			}

			console.info('[uprn/webmap-store] Loaded web map source', {
				source: describeWebMapSource(this.source)
			});
		} catch (error) {
			if (!this.isCurrentLoad(currentLoadGeneration)) {
				return;
			}

			console.error('[uprn/webmap-store] Error initializing web map', {
				source: describeWebMapSource(this.source),
				error
			});
			this.error = error instanceof Error ? error.message : String(error);
			this.data = null;
			this.isLoaded = false;
		} finally {
			if (this.isCurrentLoad(currentLoadGeneration)) {
				this.loading = false;
			}
		}
	}

	/**
	 * Configure the portal settings
	 * @param portalUrl - The URL of the portal
	 * @param proxy - The proxy settings
	 */
	public async configurePortalAsync(
		portalUrl?: string | null,
		proxy?: Proxy | null
	): Promise<void> {
		const esriConfig =
			await arcgisImport<typeof import('@arcgis/core/config.js').default>('@arcgis/core/config.js');
		const configuredDefaultPortalUrl = getDefaultPortalUrl(esriConfig);
		const nextPortalUrl = portalUrl ?? configuredDefaultPortalUrl;

		if (this.isDestroyed) {
			return;
		}

		esriConfig.portalUrl = nextPortalUrl;
		this.appliedPortalUrl = nextPortalUrl;

		if (!proxy) {
			return;
		}

		const { addProxyRule } = await arcgisImport<typeof import('@arcgis/core/core/urlUtils.js')>(
			'@arcgis/core/core/urlUtils.js'
		);
		console.log('Adding proxy rule for portal traffic');
		addProxyRule({
			urlPrefix: proxy.urlPrefix,
			proxyUrl: proxy.proxyUrl
		});
	}

	public async loadwebmapAsync(itemId: string): Promise<void> {
		await this.loadPortalWebmapAsync(itemId);
	}

	/**
	 * Clear the current webmap data
	 */
	public clear(): void {
		this.data = null;
		this.isLoaded = false;
		this.loading = false;
		this.error = null;
	}

	/**
	 * Destroy transient ArcGIS resources owned by this store.
	 */
	public async destroy(): Promise<void> {
		this.isDestroyed = true;
		this.loadGeneration++;

		const webmap = this.data;
		this.clear();

		if (webmap) {
			cleanupUprnWebMapLayerResources(webmap);
			(webmap as { destroy?: () => void }).destroy?.();
		}

		await this.restorePortalUrlAsync();
	}

	/**
	 * Reset the error state
	 */
	public clearError(): void {
		this.error = null;
	}

	/**
	 * Get the current webmap instance
	 */
	public getWebmap(): __esri.WebMap | null {
		return this.data;
	}

	private async loadPortalWebmapAsync(itemId: string): Promise<void> {
		if (this.data) {
			return;
		}

		const [WebMap, esriConfig, PortalItem] = await arcgisImport<
			[
				typeof import('@arcgis/core/WebMap').default,
				typeof import('@arcgis/core/config.js').default,
				typeof import('@arcgis/core/portal/PortalItem').default
			]
		>(['@arcgis/core/WebMap.js', '@arcgis/core/config.js', '@arcgis/core/portal/PortalItem.js']);

		const portalItem = new PortalItem({
			portal: {
				url: esriConfig.portalUrl
			},
			id: itemId
		});

		await this.setWebmapAsync(
			new WebMap({
				portalItem: portalItem
			})
		);
	}

	private async loadWebmapJsonUrlAsync(source: WebMapJsonUrlSource): Promise<void> {
		const response = await fetch(asset(source.url), {
			credentials: source.credentials
		});

		if (!response.ok) {
			throw new Error(
				`Failed to load webmap JSON from ${source.url}: ${response.status} ${response.statusText}`
			);
		}

		const webmapJson = (await response.json()) as unknown;
		await this.setWebmapAsync(
			await createWebMapFromJson(webmapJson, {
				onLayerHydrated: () => {
					this.hydrationVersion++;
				}
			})
		);
	}

	private async setWebmapAsync(webmap: __esri.WebMap): Promise<void> {
		await withTimeout(
			webmap.load(),
			WEBMAP_LOAD_TIMEOUT_MS,
			`Timed out loading web map source ${describeWebMapSource(this.source)} after ${WEBMAP_LOAD_TIMEOUT_MS / 1000} seconds.`
		);

		if (this.isDestroyed) {
			cleanupUprnWebMapLayerResources(webmap);
			(webmap as { destroy?: () => void }).destroy?.();
			return;
		}

		this.data = webmap;
		if (webmap.loaded) {
			this.isLoaded = true;
		}
	}

	private isCurrentLoad(loadGeneration: number): boolean {
		return !this.isDestroyed && loadGeneration === this.loadGeneration;
	}

	private async restorePortalUrlAsync(): Promise<void> {
		if (this.appliedPortalUrl === null) {
			return;
		}

		const esriConfig =
			await arcgisImport<typeof import('@arcgis/core/config.js').default>('@arcgis/core/config.js');
		if (esriConfig.portalUrl === this.appliedPortalUrl) {
			esriConfig.portalUrl = getDefaultPortalUrl(esriConfig);
		}

		this.appliedPortalUrl = null;
	}
}

function getDefaultPortalUrl(esriConfig: { portalUrl: string }): string {
	defaultPortalUrl ??= esriConfig.portalUrl;
	return defaultPortalUrl;
}

export function getWebMapSourcePersistenceKey(source: WebMapSource): string {
	return source.kind === 'portal-item' ? source.itemId : source.url;
}

export function describeWebMapSource(source: WebMapSource): string {
	return source.kind === 'portal-item'
		? `portal-item:${source.portalUrl ?? 'default'}:${source.itemId}`
		: `webmap-json-url:${source.url}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

function findLayerById(
	layers: __esri.Collection<__esri.Layer> | undefined,
	layerId: string
): __esri.Layer | __esri.Sublayer | null {
	if (!layers) {
		return null;
	}

	for (const layer of layers.toArray()) {
		if (layer.id === layerId) {
			return layer;
		}

		if (layer.type === 'group') {
			const found = findLayerById((layer as __esri.GroupLayer).layers, layerId);
			if (found) {
				return found;
			}
		}

		if (layer.type === 'map-image') {
			const found = (layer as __esri.MapImageLayer).sublayers?.find(
				(sublayer) => getSublayerId(sublayer, layer) === layerId
			);
			if (found) {
				return found;
			}
		}
	}

	return null;
}
