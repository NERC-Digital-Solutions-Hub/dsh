// src/routes/articles/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { markdownToHtml } from '$lib/utils/markdown-to-html';
import type { ContentConfig } from '$lib/types/config';
import { base } from '$app/paths';

let contentConfig: ContentConfig | null = null;

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const contentConfig = await getContentConfig(fetch);

	const mdUrl = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.main}`;
	const baseUrl = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.articles.dir}`;
	const indexUrl = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.articles.dir}/${contentConfig.content.research.articles.index}`;

	const articleIndex: string[] = await fetchArticleIndex(indexUrl, fetch);
	const articleMetadata = await fetchArticleMetadata(baseUrl, articleIndex, fetch);

	return {
		...(await markdownToHtml(mdUrl, fetch, setHeaders)),
		articleMetadata
	};
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

async function fetchArticleIndex(url: string, fetch: any): Promise<string[]> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch article index: ${res.status} ${res.statusText}`);
	}

	const text: string = await res.text();
	console.log('Fetched article index text:', text);
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

async function fetchArticleMetadata(
	baseUrl: string,
	articleIndex: string[],
	fetch: any
): Promise<object[]> {
	return await Promise.all(
		articleIndex.map(async (f) => {
			const r = await fetch(`${baseUrl}/${f}`);
			if (!r.ok) throw new Error(`Download failed for ${f}`);
			return await r.json();
		})
	);
}