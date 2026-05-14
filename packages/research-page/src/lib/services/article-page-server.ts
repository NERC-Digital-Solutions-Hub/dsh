import { markdownToHtml } from '$lib/utils/markdown-to-html';
import { researchArticleIndexer } from '$lib/services/research-article-indexer';
import { env } from '$env/dynamic/public';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import { error, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({ params, fetch, setHeaders }: ServerLoadEvent) => {
	try {
		const contentBaseUrl = resolveDshContentBaseUrl(
			env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
		);
		const environment = resolveContentEnvironment(env.PUBLIC_DSH_ENVIRONMENT);

		await researchArticleIndexer.initialize({
			baseUrl: contentBaseUrl,
			environment,
			fetch
		});

		const slug = params.title;
		if (!slug) {
			error(404, 'Article not found');
		}

		const articleUrl = researchArticleIndexer.getArticleUrlBySlug(slug);

		if (!articleUrl) {
			error(404, `Article not found: ${slug}`);
		}

		return await markdownToHtml(articleUrl, fetch, setHeaders);
	} catch (loadError) {
		console.error('Error loading article page:', loadError);
		throw loadError;
	}
};
