import { env } from '$env/dynamic/public';
import type {
	HomeLocalConfig,
	RootManifestPage,
	SiteManifest
} from '$lib/types/config.types';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook used to fetch the root manifest from a given URL.
 * @param url The URL to fetch the root manifest from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchRootManifest(config: HomeLocalConfig) {
	let content = $state<RootManifestPage | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		content = null;
		isLoading = true;
		error = null;

		try {
			const environment = getSiteEnvironment();
			const manifestPage: RootManifestPage = await fetchManifestPage(
				config.baseUrl,
				environment
			);

			content = manifestPage;
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

/**
 * Gets the site environment from public environment variables.
 * Falls back to production when no environment is configured.
 */
function getSiteEnvironment(): string {
	return (
		env.PUBLIC_DSH_ENVIRONMENT?.trim() ||
		'production'
	);
}

/**
 * Fetches the UPRN service manifest page from the content repository based on the configured environment.
 * @param contentBaseUrl - The base URL to the content repository.
 * @param environment - The environment name to use when selecting the manifest.
 * @returns - The UPRN service manifest page.
 */
async function fetchManifestPage(
	contentBaseUrl: string,
	environment: string
): Promise<RootManifestPage> {
	const manifestPath: string = `manifest.${environment}.json`;
	const manifestUrl: string = new SvelteURL(manifestPath, contentBaseUrl).toString();

	const response = await fetch(manifestUrl);
	if (!response.ok) {
		throw new Error(`Manifest fetch failed: ${response.statusText}`);
	}

	const manifest: SiteManifest = (await response.json()) as SiteManifest;
	const page: RootManifestPage | undefined = manifest.pages.find(
		(p) => p.route === '/'
	) as RootManifestPage;
	if (!page) {
		throw new Error('Manifest does not contain an entry for /');
	}

	return page;
}
