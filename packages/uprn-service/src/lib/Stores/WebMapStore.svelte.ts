import { browser } from '$app/environment';
import type { IWebMapService } from '$lib/Services/IWebMapService.js';
import { getSublayerId } from '$lib/Utilities/TreeviewUtilities';
import { SvelteMap } from 'svelte/reactivity';

export type WebMapStoreParams = {
	portalUrl?: string | null;
	itemId: string;
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

	private initialPortalUrl: string | null = null;

	constructor(params: WebMapStoreParams) {
		if (!browser) {
			return;
		}

		this.loading = true;
		this.error = null;

		const async = async () => {
			try {
				const { portalUrl, itemId, proxy } = params;
				await this.configurePortalAsync(portalUrl, proxy);
				await this.loadwebmapAsync(itemId);
			} catch (error) {
				console.error('Error initializing webmap:', error);
				this.error = (error as Error).message;
			} finally {
				this.loading = false;
			}
		};

		async();
	}

	/**
	 * Retrieves a layer by its ID.
	 * @param layerId The layer ID.
	 * @return The layer or sublayer with the specified ID, or null if not found.
	 */
	public getLayerById(layerId: string): __esri.Layer | __esri.Sublayer | null {
		return this.dataLookup.get(layerId) || null;
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
		const { default: esriConfig } = await import('@arcgis/core/config.js');

		if (!portalUrl) {
			if (this.initialPortalUrl) {
				esriConfig.portalUrl = this.initialPortalUrl;
			}
			return;
		}

		if (!this.initialPortalUrl) {
			this.initialPortalUrl = esriConfig.portalUrl;
		}

		esriConfig.portalUrl = portalUrl as string;
		//console.log(esriConfig);

		if (!proxy) {
			return;
		}

		const { addProxyRule } = await import('@arcgis/core/core/urlUtils.js');
		console.log('Adding proxy rule for portal traffic');
		addProxyRule({
			urlPrefix: proxy?.urlPrefix as string,
			proxyUrl: proxy?.proxyUrl as string
		});
	}

	public async loadwebmapAsync(itemId: string): Promise<void> {
		if (this.data) {
			return;
		}

		const [{ default: WebMap }, { default: esriConfig }, { default: PortalItem }] =
			await Promise.all([
				import('@arcgis/core/WebMap'),
				import('@arcgis/core/config.js'),
				import('@arcgis/core/portal/PortalItem')
			]);

		const portalItem = new PortalItem({
			portal: {
				url: esriConfig.portalUrl
			},
			id: itemId
		});

		const webmap = new WebMap({
			portalItem: portalItem
		});

		this.data = webmap;

		await this.data.loadAll();
		if (this.data.loaded) {
			this.isLoaded = true;
		}
	}

	/**
	 * Clear the current webmap data
	 */
	public clear(): void {
		this.data = null;
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
}
