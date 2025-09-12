export interface AppConfig {
	portalItemId: string;
}

let appConfig: AppConfig | null = null;

export async function getAppConfigAsync(): Promise<AppConfig> {
	if (!appConfig) {
		appConfig = await fetch('/app-config.json').then((res) => res.json());
	}

	return appConfig as AppConfig;
}
