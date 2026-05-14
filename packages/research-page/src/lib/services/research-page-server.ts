import { markdownToHtml } from '$lib/utils/markdown-to-html';
import type { ContentConfig } from '$lib/types/config';
import { base } from '$app/paths';
import { researchArticleIndexer } from '$lib/services/research-article-indexer';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createContentSource,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import type { ServerLoadEvent } from '@sveltejs/kit';

let contentConfig: ContentConfig | null = null;

export const load = async ({ fetch, setHeaders }: ServerLoadEvent) => {
	try {
		const contentConfig = await getContentConfig(fetch);
		const contentBaseUrl = resolveDshContentBaseUrl(
			contentConfig.content.baseUrl || DEFAULT_DSH_CONTENT_BASE_URL
		);
		const assetBaseUrl = resolveDshContentBaseUrl(
			contentConfig.content.assetBaseUrl || contentBaseUrl
		);
		const environment = resolveContentEnvironment(contentConfig.content.environment);
		const source = createContentSource({
			baseUrl: contentBaseUrl,
			environment,
			fetch
		});
		const assetSource = createContentSource({
			baseUrl: assetBaseUrl,
			environment,
			fetch
		});
		const researchPage = await source.getPage('/research');

		await researchArticleIndexer.initialize({
			baseUrl: contentBaseUrl,
			assetBaseUrl,
			environment,
			fetch
		});
		const articleMetadata = researchArticleIndexer.getAllMetadata();

		return {
			...(await markdownToHtml(
				assetSource.resolvePageFileUrl(researchPage, 'main'),
				fetch,
				setHeaders
			)),
			articleMetadata
		};
	} catch (loadError) {
		console.error('Error loading research page:', loadError);
		throw loadError;
	}
};

async function getContentConfig(fetch: ServerLoadEvent['fetch']): Promise<ContentConfig> {
	if (contentConfig) {
		return contentConfig;
	}

	const res = await fetch(`${base}/config/content.json`);
	if (!res.ok) {
		throw new Error(`Failed to fetch content config: ${res.status} ${res.statusText}`);
	}

	contentConfig = (await res.json()) as ContentConfig;
	return contentConfig;
}
