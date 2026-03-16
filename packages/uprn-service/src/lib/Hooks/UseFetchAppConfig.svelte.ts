import { asset } from '$app/paths';
import { getCachedConfig, putCachedConfig } from '$lib/db';
import { useFetchUprnServiceManifest } from '$lib/Hooks/UseFetchUprnServiceManifest.svelte';
import { ConfigTransformer } from '$lib/Services/config-api/config-transformer';
import { CsvConfigFetcher } from '$lib/Services/config-api/csv-config-fetcher';
import type {
	AppsUprnConfig,
	AppsUprnServiceManifestPage,
	LocalAppsUprnConfig
} from '$lib/Types/Configuration.types';
import type { TreeviewNodeConfig } from '$lib/Types/Treeview.types';
import type { UprnServiceConfigManifest } from '$lib/Types/Uprn.types';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook used to fetch app config information from a given URL. It manages the loading state, any errors that occur during fetching,
 * and the fetched content itself.
 *
 * The hook implements an IndexedDB-backed caching strategy for the expensive
 * CSV fetch + transform pipeline:
 * 1. Fetch the lightweight remote manifest to obtain the current version.
 * 2. If a cached transformed config exists with the same version — use it
 *    directly, skipping CSV downloads and transformation.
 * 3. If the versions differ (or no cache exists) — fetch the CSVs, transform
 *    them, persist the result alongside the version, and continue.
 * 4. If the manifest cannot be fetched (network error) — fall back to any
 *    previously cached transformed config so the app remains functional offline.
 *
 * @returns The loading, error, content states as well as a fetch method.
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
			console.log('Fetched local config', { localConfig });

			const fetchUprnServiceManifest = useFetchUprnServiceManifest(localConfig.content);
			await fetchUprnServiceManifest.fetch();

			if (fetchUprnServiceManifest.error) {
				throw new Error(`Failed to fetch UPRN service manifest: ${fetchUprnServiceManifest.error}`);
			}

			const manifest: AppsUprnServiceManifestPage | null = fetchUprnServiceManifest.content;
			if (!manifest) {
				throw new Error('UPRN service manifest content is null');
			}

			// await uprnConfigStore.load(localConfigPath);

			// const portalItemConfigs: MapConfig[] =
			// 	uprnConfigStore.instance?.mapsConfig
			// 		.map((m) => m.value)
			// 		.filter((v): v is MapConfig => v !== undefined) ?? [];

			const baseUrl = new SvelteURL('pages/', localConfig.content.baseUrl).toString();
			console.log('Base URL for config:', baseUrl);
			const manifestPath = manifest.files.generated.manifest;
			const treeviewNodeConfigs = await fetchAndTransformConfig(baseUrl, manifestPath);

			content = {
				map: localConfig.mapConfig,
				content: {
					baseUrl: baseUrl,
					manifest
				},
				uprnDownload: localConfig.uprnDownload,
				aiUprnChatbot: localConfig.aiUprnChatbot,
				treeviewConfig: { ...localConfig.mapConfig.treeview, layers: [...treeviewNodeConfigs] }
			};

			// const map: MapConfig = {
			// 	...portalItemConfigs[0],
			// 	treeview: { ...portalItemConfigs[0].treeview, layers: [...treeviewNodeConfigs] }
			// };

			// const contentConfig: ContentConfig | undefined = uprnConfigStore.instance?.contentConfig;
			// if (!contentConfig) {
			// 	console.error('Content configuration is missing');
			// 	throw new Error('Content configuration is missing');
			// }

			// const uprnChatbotApiConfig: AiUprnChatbotEndpoints | undefined =
			// 	uprnConfigStore.instance?.uprnChatbotApiConfig.value;
			// if (!uprnChatbotApiConfig) {
			// 	console.error('AI UPRN chatbot API configuration is missing');
			// 	throw new Error('AI UPRN chatbot API configuration is missing');
			// }

			// const uprnDownloadApiConfig: UprnDownloadEndpoints | undefined =
			// 	uprnConfigStore.instance?.uprnDownloadApiConfig.value;
			// if (!uprnDownloadApiConfig) {
			// 	console.error('UPRN download API configuration is missing');
			// 	throw new Error('UPRN download API configuration is missing');
			// }

			// content = {
			// 	map,
			// 	contentConfig: contentConfig,
			// 	aiUprnChatbot: uprnChatbotApiConfig,
			// 	uprnDownload: uprnDownloadApiConfig
			// };
		} catch (err) {
			console.error('Error fetching app config', err);
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

// ---------------------------------------------------------------------------
// Manifest + CSV pipeline with IndexedDB caching
// ---------------------------------------------------------------------------

/**
 * Orchestrates the manifest fetch and CSV transform pipeline with caching.
 *
 * 1. Attempt to fetch the remote manifest to learn the current version.
 * 2. If a cached transformed config with a matching version exists in
 *    IndexedDB, return it immediately (no CSV fetch / transform needed).
 * 3. Otherwise, fetch the CSVs, transform them, persist the result, and return.
 * 4. On network failure, fall back to any existing cached config; if none
 *    exists, re-throw so the caller can surface the error.
 */
async function fetchAndTransformConfig(
	baseUrl: string,
	relativeManifestPath: string
): Promise<ReadonlyArray<TreeviewNodeConfig>> {
	const manifestUrl = new URL(relativeManifestPath, baseUrl).toString();

	let manifest: UprnServiceConfigManifest;

	try {
		manifest = await fetchManifest(manifestUrl);
	} catch (err) {
		// Network / fetch error — attempt to fall back to a cached transform.
		const cached = await getCachedConfig(manifestUrl).catch(() => undefined);
		if (cached) {
			console.warn(
				'[config-cache] Network error fetching manifest; falling back to cached transformed config (version %d)',
				cached.version,
				err
			);
			return cached.layers;
		}
		throw err;
	}

	// Check for a cached transformed config with the same version.
	const cached = await getCachedConfig(manifestUrl);
	if (cached && cached.version === manifest.version) {
		console.log(
			'[config-cache] Cache hit — version %d matches, using cached transformed config',
			manifest.version
		);
		return cached.layers;
	}

	console.log(
		'[config-cache] Cache %s — fetching and transforming CSVs for version %d',
		cached ? `stale (had v${cached.version})` : 'miss',
		manifest.version
	);

	// Fetch CSVs and transform.
	const base = new SvelteURL(baseUrl);

	// remove trailing /pages/ if present
	base.pathname = base.pathname.replace(/\/pages\/?$/, '/');
	const layers = await fetchAndTransformCsvs(base.toString(), manifest);

	// Persist the transformed result.
	await putCachedConfig(manifestUrl, manifest.version, [...layers]);
	console.log('[config-cache] Stored transformed config for version %d', manifest.version);

	return layers;
}

/**
 * Fetches the manifest JSON from the remote endpoint.
 */
async function fetchManifest(manifestUrl: string): Promise<UprnServiceConfigManifest> {
	const response = await fetch(manifestUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch config manifest: ${response.status} ${response.statusText}`);
	}
	return await response.json();
}

/**
 * Fetches CSVs referenced by the manifest and transforms them into
 * `TreeviewNodeConfig[]`.
 */
async function fetchAndTransformCsvs(
	baseUrl: string,
	manifest: UprnServiceConfigManifest
): Promise<ReadonlyArray<TreeviewNodeConfig>> {
	const foldersCsvPath = new SvelteURL(
		manifest.output.find((o) => o.sheet_name === 'folders')?.csv_path ?? '',
		baseUrl
	).toString();
	const datasetsCsvPath = new SvelteURL(
		manifest.output.find((o) => o.sheet_name === 'datasets')?.csv_path ?? '',
		baseUrl
	).toString();
	const variablesCsvPath = new SvelteURL(
		manifest.output.find((o) => o.sheet_name === 'variables')?.csv_path ?? '',
		baseUrl
	).toString();

	const configFetcher = new CsvConfigFetcher(datasetsCsvPath, variablesCsvPath, foldersCsvPath);
	const { folders, datasets, variables } = await configFetcher.fetch();
	const configTransformer = new ConfigTransformer();
	return await configTransformer.transform({ folders, datasets, variables });
}
