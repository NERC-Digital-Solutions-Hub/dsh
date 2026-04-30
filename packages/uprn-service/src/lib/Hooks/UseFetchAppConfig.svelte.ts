import { asset } from '$app/paths';
import { getCachedConfig, putCachedConfig } from '$lib/db';
import type { CustomRenderers } from '$lib/Types/CustomRenderers.types';
import type { AppsUprnConfig, LocalAppsUprnConfig } from '$lib/Types/Configuration.types';
import type { TreeviewNodeConfig } from '$lib/Types/Treeview.types';
import {
	getUprnCustomRenderers,
	getUprnIntroduction,
	getUprnSettings,
	getUprnTreeviewLayerPayload
} from '@dsh/content-api';

const TREEVIEW_CONFIG_CACHE_KEY = 'content-api:uprn/treeview-layers';

/**
 * Fetches the local operational app config, then enriches it with content served
 * through @dsh/content-api.
 */
export function useFetchAppConfig() {
	let content = $state<AppsUprnConfig | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	const localConfigPath = asset('/config/apps/uprn/config.json');

	async function fetchAsync() {
		content = null;
		isLoading = true;
		error = null;

		try {
			const response = await fetch(localConfigPath);
			if (!response.ok) {
				throw new Error(`Failed to fetch local config: ${response.status} ${response.statusText}`);
			}

			const localConfig: LocalAppsUprnConfig = await response.json();
			console.log('[uprn/config] Fetched local operational config', { localConfig });

			const [settings, introductionMarkdown, customRenderers, treeviewLayerPayload] =
				await Promise.all([
					getUprnSettings(),
					getUprnIntroduction(),
					getUprnCustomRenderers<CustomRenderers>(),
					getUprnTreeviewLayerPayload()
				]);

			const treeviewNodeConfigs = await getTreeviewLayersFromCache(
				treeviewLayerPayload as { version: number; layers: TreeviewNodeConfig[] }
			);

			content = {
				map: localConfig.mapConfig,
				content: {
					settings,
					introductionMarkdown,
					customRenderers
				},
				uprnDownload: localConfig.uprnDownload,
				aiUprnChatbot: localConfig.aiUprnChatbot,
				treeviewConfig: { ...localConfig.mapConfig.treeview, layers: [...treeviewNodeConfigs] }
			};
		} catch (err) {
			console.error('[uprn/config] Error fetching app config', err);
			error = err;
		} finally {
			isLoading = false;
		}
	}

	return {
		get content() {
			return content;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		fetch: fetchAsync
	};
}

async function getTreeviewLayersFromCache(payload: {
	version: number;
	layers: TreeviewNodeConfig[];
}): Promise<TreeviewNodeConfig[]> {
	const cached = await getCachedConfig(TREEVIEW_CONFIG_CACHE_KEY).catch(() => undefined);
	if (cached && cached.version === payload.version) {
		console.log(
			'[config-cache] Cache hit - version %d matches, using cached content-api treeview config',
			payload.version
		);
		return cached.layers;
	}

	await putCachedConfig(TREEVIEW_CONFIG_CACHE_KEY, payload.version, [...payload.layers]);
	console.log('[config-cache] Stored content-api treeview config for version %d', payload.version);
	return payload.layers;
}
