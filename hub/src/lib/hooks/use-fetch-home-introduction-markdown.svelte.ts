import type {
	HomeLocalConfig,
	RemoteSiteConfig,
	RootManifestPage,
	SiteManifest
} from '$lib/types/config.types';
import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook used to fetch the home introduction markdown from a given URL.
 * @param url The URL to fetch the home introduction markdown from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchHomeIntroductionMarkdown(config: HomeLocalConfig) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		content = null;
		isLoading = true;
		error = null;

		try {
			const siteUrl = new SvelteURL(config.sitePath, config.baseUrl).toString();

			const siteConfig = await fetchSiteConfig(siteUrl);

			const pageBaseUrl = new SvelteURL('pages/', config.baseUrl).toString();
			console.log('Page base URL:', pageBaseUrl);

			const page = await fetchManifestPage(config.baseUrl, siteConfig);
			const introductionUrl = new SvelteURL(page.files.introduction, pageBaseUrl).toString();

			const response = await fetch(introductionUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch home introduction markdown: ${response.status} ${response.statusText}`
				);
			}

			content = await response.text();
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
async function fetchManifestPage(
	contentBaseUrl: string,
	siteConfig: RemoteSiteConfig
): Promise<RootManifestPage> {
	const manifestPath: string = `manifest.${siteConfig.environment}.json`;
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
