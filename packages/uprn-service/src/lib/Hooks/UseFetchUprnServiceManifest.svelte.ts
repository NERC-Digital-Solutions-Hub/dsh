import { asset } from '$app/paths';
import type {
	RemoteSiteConfig,
	AppUprnContentConfig,
	SiteManifest,
	AppsUprnServiceManifestPage
} from '$lib/Types/Configuration.types';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook used to fetch the manifest for the UPRN service page.
 * @param contentConfig The content configuration containing the base URL and site path for fetching the manifest.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchUprnServiceManifest(contentConfig: AppUprnContentConfig) {
	let content = $state<AppsUprnServiceManifestPage | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const siteConfigUrl = asset('/site.json');
			console.log('Fetching site config from', siteConfigUrl);
			const siteConfig: RemoteSiteConfig = await fetchSiteConfig(siteConfigUrl);
			const manifestPage: AppsUprnServiceManifestPage = await fetchUprnServiceManifestPage(
				contentConfig.baseUrl,
				siteConfig
			);

			content = manifestPage;
		} catch (err) {
			error = err;
			content = null;
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
 * Fetches the site configuration from the given URL and returns it as a SiteConfig object.
 * @param siteConfigUrl - The URL to the site configuration.
 * @returns The site configuration.
 */
async function fetchSiteConfig(siteConfigUrl: string): Promise<RemoteSiteConfig> {
	const response = await fetch(siteConfigUrl);
	if (!response.ok) {
		throw new Error(`Site config fetch failed: ${response.statusText}`);
	}

	return (await response.json()) as RemoteSiteConfig;
}

/**
 * Fetches the UPRN service manifest page from the content repository based on the provided site configuration.
 * @param contentBaseUrl - The base URL to the content repository.
 * @param siteConfig - The site configuration.
 * @returns - The UPRN service manifest page.
 */
async function fetchUprnServiceManifestPage(
	contentBaseUrl: string,
	siteConfig: RemoteSiteConfig
): Promise<AppsUprnServiceManifestPage> {
	const manifestPath: string = `manifest.${siteConfig.environment}.json`;
	const manifestUrl: string = new SvelteURL(manifestPath, contentBaseUrl).toString();

	const response = await fetch(manifestUrl);
	if (!response.ok) {
		throw new Error(`Manifest fetch failed: ${response.statusText}`);
	}

	const manifest: SiteManifest = (await response.json()) as SiteManifest;
	const page: AppsUprnServiceManifestPage | undefined = manifest.pages.find(
		(p) => p.route === '/apps/uprn-service'
	) as AppsUprnServiceManifestPage;
	if (!page) {
		throw new Error('Manifest does not contain an entry for /apps/uprn-service');
	}

	return page;
}
