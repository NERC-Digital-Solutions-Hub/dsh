import { browser } from '$app/environment';
import type { IWebMapService } from '$lib/Services/IWebMapService.js';
import type { MapConfig } from '$lib/Types/Configuration.types';
import { createWebMapFromJson } from '$lib/Stores/WebMapCustomLoader';
import { arcgisImport } from '$lib/Utilities/ArcgisLoader';
import { getSublayerId } from '$lib/Utilities/TreeviewUtilities';
import { SvelteMap } from 'svelte/reactivity';

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
	private initialPortalUrl: string | null = null;

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
		if (this.data || this.loading) {
			return;
		}

		this.loading = true;
		this.error = null;
		this.isLoaded = false;

		try {
			if (this.source.portalUrl || this.proxy) {
				await this.configurePortalAsync(this.source.portalUrl, this.proxy);
			}

			if (this.source.kind === 'portal-item') {
				await this.loadPortalWebmapAsync(this.source.itemId);
			} else {
				await this.loadWebmapJsonUrlAsync(this.source);
			}
		} catch (error) {
			console.error('Error initializing webmap:', error);
			this.error = error instanceof Error ? error.message : String(error);
			this.data = null;
			this.isLoaded = false;
		} finally {
			this.loading = false;
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

		if (portalUrl) {
			if (!this.initialPortalUrl) {
				this.initialPortalUrl = esriConfig.portalUrl;
			}

			esriConfig.portalUrl = portalUrl;
		} else if (this.initialPortalUrl) {
			esriConfig.portalUrl = this.initialPortalUrl;
		}

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
		const response = await fetch(source.url, {
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
		this.data = webmap;

		await this.data.load();
		if (this.data.loaded) {
			this.isLoaded = true;
		}
	}
}

export function getWebMapSourcePersistenceKey(source: WebMapSource): string {
	return source.kind === 'portal-item' ? source.itemId : source.url;
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
