import { markdownToHtml } from '$lib/utils/markdown-to-html';
import { researchArticleIndexer } from '$lib/services/research-article-indexer';
import { env } from '$env/dynamic/public';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createContentSource,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import type { ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({ fetch, setHeaders }: ServerLoadEvent) => {
	try {
		const contentBaseUrl = resolveDshContentBaseUrl(
			env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
		);
		const environment = resolveContentEnvironment(env.PUBLIC_DSH_ENVIRONMENT);
		const source = createContentSource({
			baseUrl: contentBaseUrl,
			environment,
			fetch
		});
		const researchPage = await source.getPage('/research');

		await researchArticleIndexer.initialize({
			baseUrl: contentBaseUrl,
			environment,
			fetch
		});
		const articleMetadata = researchArticleIndexer.getAllMetadata();

		return {
			...(await markdownToHtml(
				source.resolvePageFileUrl(researchPage, 'main'),
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
