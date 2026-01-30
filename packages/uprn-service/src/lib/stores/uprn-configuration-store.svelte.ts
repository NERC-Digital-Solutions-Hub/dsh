import { ConfigManager } from '$lib/stores/config-manager.svelte';
import type { PortalItemConfig } from '$lib/types/config';
import type {
	AiUprnChatbotEndpoints,
	ConfigurationItemInfo,
	SidebarSize,
	UprnConfiguration,
	UprnDownloadEndpoints
} from '$lib/types/uprn';

export class UprnConfigurationStore {
	public uprnDownloadApiConfig = new ConfigManager<UprnDownloadEndpoints>();
	public uprnChatbotApiConfig = new ConfigManager<AiUprnChatbotEndpoints>();
	public mapsConfig = $state<ConfigManager<PortalItemConfig>[]>([]);
	public mainSidebarSizes = $state<SidebarSize[]>([]);

	public async init(configuration: UprnConfiguration) {
		this.mainSidebarSizes = configuration.mainSidebarSizes ?? [];
		await Promise.all([
			this.#loadConfigItem(this.uprnDownloadApiConfig, configuration.uprnDownloadApiConfig),
			this.#loadConfigItem(this.uprnChatbotApiConfig, configuration.aiUprnChatbotApiConfig),
			this.#loadMapsConfig(configuration.mapsConfig)
		]);
	}

	async #loadConfigItem<T>(manager: ConfigManager<T>, info: ConfigurationItemInfo) {
		try {
			await manager.loadFromUrl(info.path);
		} catch (error) {
			console.error(`Failed to load config from ${info.path}`, error);
		}
	}

	async #loadMapsConfig(infos: ConfigurationItemInfo[]) {
		const mapsConfig = infos.map(() => new ConfigManager<PortalItemConfig>());
		for (let i = 0; i < infos.length; i++) {
			await this.#loadConfigItem(mapsConfig[i], infos[i]);
		}

		console.log('Loaded maps config for', mapsConfig.length, 'items', mapsConfig);
		this.mapsConfig = mapsConfig;
	}
}
