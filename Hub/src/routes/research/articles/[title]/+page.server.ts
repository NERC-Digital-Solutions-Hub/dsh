// src/routes/articles/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { markdownToHtml } from '$lib/utils/markdown-to-html';
import type { ContentConfig } from '$lib/types/config';
import { base } from '$app/paths';

let contentConfig: ContentConfig | null = null;

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const contentConfig = await getContentConfig(fetch);

	const mdPath = `${params.title}.md`;
	const url = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.articles}/${mdPath}`;
	console.log('Fetching markdown from URL:', url);
	return await markdownToHtml(url, fetch, setHeaders);
};

async function getContentConfig(fetch: any): Promise<ContentConfig> {
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
