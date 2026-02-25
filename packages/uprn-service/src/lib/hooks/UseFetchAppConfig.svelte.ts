import { asset } from '$app/paths';
import { ConfigTransformer } from '$lib/Services/config-api/config-transformer';
import { CsvConfigFetcher } from '$lib/Services/config-api/csv-config-fetcher';
import { uprnConfigStore } from '$lib/Stores/UprnStore.svelte';
import type { AppsUprnConfig, PortalItemConfig } from '$lib/Types/config';
import type { TreeviewNodeConfig } from '$lib/Types/treeview';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/Types/uprn';

/**
 * Hook used to fetch app config information from a given URL. It manages the loading state, any errors that occur during fetching,
 * and the fetched content itself.
 * @param url The URL to the app config information.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchAppConfig() {
	let content = $state<AppsUprnConfig | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	const configBasePath = asset('/config/apps/uprn/config.json');
	const foldersCsvPath = asset('/config/apps/uprn/api/folders.csv');
	const datasetsCsvPath = asset('/config/apps/uprn/api/datasets.csv');
	const variablesCsvPath = asset('/config/apps/uprn/api/variables.csv');

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			await uprnConfigStore.load(configBasePath);
			const portalItemConfigs: PortalItemConfig[] =
				uprnConfigStore.instance?.mapsConfig
					.map((m) => m.value)
					.filter((v): v is PortalItemConfig => v !== undefined) ?? [];

			const configFetcher = new CsvConfigFetcher(datasetsCsvPath, variablesCsvPath, foldersCsvPath);
			const { folders, datasets, variables } = await configFetcher.fetch();
			const configTransformer = new ConfigTransformer();
			const treeviewNodeConfigs: ReadonlyArray<TreeviewNodeConfig> =
				await configTransformer.transform({ folders, datasets, variables });

			const map: PortalItemConfig = {
				...portalItemConfigs[0],
				treeview: { ...portalItemConfigs[0].treeview, layers: [...treeviewNodeConfigs] }
			};

			const uprnChatbotApiConfig: AiUprnChatbotEndpoints | undefined =
				uprnConfigStore.instance?.uprnChatbotApiConfig.value;
			if (!uprnChatbotApiConfig) {
				console.error('AI UPRN chatbot API configuration is missing');
				throw new Error('AI UPRN chatbot API configuration is missing');
			}

			const uprnDownloadApiConfig: UprnDownloadEndpoints | undefined =
				uprnConfigStore.instance?.uprnDownloadApiConfig.value;
			if (!uprnDownloadApiConfig) {
				console.error('UPRN download API configuration is missing');
				throw new Error('UPRN download API configuration is missing');
			}

			content = {
				map,
				aiUprnChatbot: uprnChatbotApiConfig,
				uprnDownload: uprnDownloadApiConfig
			};
		} catch (err) {
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
