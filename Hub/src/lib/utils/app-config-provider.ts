import { base } from '$app/paths';
import type { AppConfig } from '$lib/types/config';

// export type AppConfig = {
// 	portalUrl?: string | null;
// 	portalItemId: string;
// 	proxy?: Proxy | null;
// 	catalogueApiUrl: string;
// 	dataSelectionTreeviewConfig?: TreeviewConfig;
// 	areaSelectionTreeviewConfig?: TreeviewConfig;
// 	selectionLayersNameFields?: LayerNameField[];
// 	fieldsToHide?: string[];
// };

// export type Proxy = {
// 	urlPrefix: string;
// 	proxyUrl: string;
// };

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
		appConfig = await fetch(`${base}/config/app.json`).then((res) => res.json());
		if (!appConfig) {
			appConfig = {} as AppConfig;
		}

		const catalogueConfig = await fetch(`${base}/config/catalogue/config.json`).then((res) =>
			res.json()
		);
		appConfig.catalogueConfig = catalogueConfig;

		const serviceUprnConfig = await fetch(`${base}/config/apps/uprn/config.json`).then((res) =>
			res.json()
		);
		appConfig.serviceUprnConfig = serviceUprnConfig;

		const serviceUprn2Config = await fetch(`${base}/config/apps/uprn/config.json`).then((res) =>
			res.json()
		);
		appConfig.serviceUprn2Config = serviceUprn2Config;
	}

	return appConfig as AppConfig;
}
