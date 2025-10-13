import { base } from '$app/paths';
import { type LayerNameField } from '$lib/stores/area-selection-store.svelte';
import type { TreeviewConfig } from '$lib/types/treeview.js';

export type AppConfig = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	catalogueApiUrl: string;
	dataSelectionTreeviewConfig?: TreeviewConfig;
	areaSelectionTreeviewConfig?: TreeviewConfig;
	selectionLayersNameFields?: LayerNameField[];
	fieldsToHide?: string[];
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
};

// export type TreeviewConfig = {
// 	layers: TreeviewLayerConfig[];
// };

// export type TreeviewLayerConfig = {
// 	name: string;
// 	isDownloadable?: boolean;
// 	visibilityGroup?: string;
// };

let appConfig: AppConfig | null = null;

/**
 * Fetches the application configuration from a JSON file.
 */
export async function getAppConfigAsync(): Promise<AppConfig> {
	if (!appConfig) {
		appConfig = await fetch(`${base}/app-config.json`).then((res) => res.json());
	}

	return appConfig as AppConfig;
}
