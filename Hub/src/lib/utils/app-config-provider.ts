import { base } from '$app/paths';

export type AppConfig = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	treeviewDataConfig: TreeviewConfig[];
	treeviewSelectionAreasConfig: TreeviewConfig[];
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
};

export type TreeviewConfig = {
	name: string;
};

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
