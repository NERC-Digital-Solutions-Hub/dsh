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

		const esriConfig = await import('@arcgis/core/config.js');
		esriConfig.default.portalUrl = portalUrl as string;
		console.log(esriConfig);

		if (!proxy) {
			return;
		}

		const urlUtils = await import('@arcgis/core/core/urlUtils.js');
		console.log(urlUtils);
		urlUtils.addProxyRule({
			urlPrefix: proxy?.urlPrefix as string,
			proxyUrl: proxy?.proxyUrl as string
		});
	}

	async loadwebmapAsync(itemId: string): Promise<void> {
		if (this.data) {
			return;
		}

		const [{ default: WebMap }, { default: PortalItem }] = await Promise.all([
			import('@arcgis/core/WebMap'),
			import('@arcgis/core/portal/PortalItem')
		]);

		const portalItem = new PortalItem({
			id: itemId
		});

		const webmap = new WebMap({
			portalItem: portalItem
		});

		await webmap.loadAll();
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
