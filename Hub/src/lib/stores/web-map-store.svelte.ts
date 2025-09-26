import { browser } from '$app/environment';
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
export class WebMapStore {
	public data: __esri.WebMap | null = $state<__esri.WebMap | null>(null);
	public dataLookup: SvelteMap<string, __esri.Layer> = $derived.by(() => {
		const map = new SvelteMap<string, __esri.Layer>();
		function addLayerRecursively(layer: __esri.Layer) {
			map.set(layer.uid, layer);
			if (layer.type === 'group') {
				const groupLayer = layer as __esri.GroupLayer;
				groupLayer.layers.forEach((lyr) => {
					addLayerRecursively(lyr);
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
	 * Initializes the webmap from a portal URL and item ID.
	 * @param params - The parameters for initializing the webmap.
	 */
	async initializeAsync(params: WebMapStoreParams): Promise<void> {
		if (this.data) {
			return;
		}

		if (!browser) {
			return;
		}

		this.loading = true;
		this.error = null;

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
	}

	/**
	 * Configure the portal settings
	 * @param portalUrl - The URL of the portal
	 * @param proxy - The proxy settings
	 */
	async configurePortalAsync(portalUrl?: string | null, proxy?: Proxy | null): Promise<void> {
		if (!portalUrl) {
			return;
		}

		const esriConfig = await loadEsriConfig();
		esriConfig.portalUrl = portalUrl as string;
		console.log(esriConfig);

		if (!proxy) {
			return;
		}

		const { addProxyRule } = await loadUrlUtils();
		console.log('Adding proxy rule for portal traffic');
		addProxyRule({
			urlPrefix: proxy?.urlPrefix as string,
			proxyUrl: proxy?.proxyUrl as string
		});
	}

	async loadwebmapAsync(itemId: string): Promise<void> {
		if (this.data) {
			return;
		}

		const [WebMap, PortalItem] = await Promise.all([loadWebMapCtor(), loadPortalItemCtor()]);

		const portalItem = new PortalItem({
			id: itemId
		});

		const webmap = new WebMap({
			portalItem: portalItem
		});

		//await webmap.load();
		this.data = webmap;
	}

	/**
	 * Clear the current webmap data
	 */
	clear(): void {
		this.data = null;
		this.loading = false;
		this.error = null;
	}

	/**
	 * Reset the error state
	 */
	clearError(): void {
		this.error = null;
	}

	/**
	 * Get the current webmap instance
	 */
	getWebmap(): __esri.WebMap | null {
		return this.data;
	}
}

let webMapCtorPromise: Promise<(typeof import('@arcgis/core/WebMap'))['default']> | null = null;
let portalItemCtorPromise: Promise<
	(typeof import('@arcgis/core/portal/PortalItem'))['default']
> | null = null;
let esriConfigPromise: Promise<(typeof import('@arcgis/core/config.js'))['default']> | null = null;
let urlUtilsPromise: Promise<typeof import('@arcgis/core/core/urlUtils.js')> | null = null;

async function loadWebMapCtor() {
	if (!browser) {
		throw new Error('Attempted to load WebMap outside the browser');
	}

	if (!webMapCtorPromise) {
		webMapCtorPromise = import('@arcgis/core/WebMap').then((module) => module.default);
	}

	return webMapCtorPromise;
}

async function loadPortalItemCtor() {
	if (!browser) {
		throw new Error('Attempted to load PortalItem outside the browser');
	}

	if (!portalItemCtorPromise) {
		portalItemCtorPromise = import('@arcgis/core/portal/PortalItem').then(
			(module) => module.default
		);
	}

	return portalItemCtorPromise;
}

async function loadEsriConfig() {
	if (!browser) {
		throw new Error('Attempted to load esriConfig outside the browser');
	}

	if (!esriConfigPromise) {
		esriConfigPromise = import('@arcgis/core/config.js').then((module) => module.default);
	}

	return esriConfigPromise;
}

async function loadUrlUtils() {
	if (!browser) {
		throw new Error('Attempted to load urlUtils outside the browser');
	}

	if (!urlUtilsPromise) {
		urlUtilsPromise = import('@arcgis/core/core/urlUtils.js');
	}

	return urlUtilsPromise;
}
