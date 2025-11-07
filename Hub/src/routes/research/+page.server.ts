// src/routes/articles/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { markdownToHtml } from '$lib/utils/markdown-to-html';
import type { ContentConfig } from '$lib/types/config';
import { base } from '$app/paths';

let contentConfig: ContentConfig | null = null;

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const contentConfig = await getContentConfig(fetch);

	const mdUrl = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.main}`;

	//const articleRootDirUrl = `https://api.github.com/repos/${contentConfig.content.organisation}/${contentConfig.content.repo}/contents/${encodeURI(contentConfig.content.relativePath)}/${encodeURI(contentConfig.content.research.dir)}/${encodeURI(contentConfig.content.research.articles)}?ref=${encodeURIComponent('dev')}`;
	// const articleMetadata: object[] = await fetchArticleMetadata(articleRootDirUrl, fetch);
	// console.log('Article metadata:', articleMetadata);

	const articleMetadataUrl = `https://github.com/${contentConfig.content.organisation}/${contentConfig.content.repo}/raw/refs/heads/dev/${contentConfig.content.relativePath}/${contentConfig.content.research.dir}/${contentConfig.content.research.articles}/ai-function-calling.json`;
	const articleMetadata = await fetchSingleArticleMetadata(articleMetadataUrl, fetch);

	console.log('Article metadata:', articleMetadata);

	return {
		...(await markdownToHtml(mdUrl, fetch, setHeaders)),
		articleMetadata: [articleMetadata]
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

async function fetchArticleMetadata(articleRootDirUrl: string, fetch: any): Promise<object[]> {
	const res = await fetch(articleRootDirUrl, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'ndsh-hub/1.0'
		}
	});

	if (!res.ok) {
		console.error('GitHub API response:', await res.text());
		throw new Error(`GitHub list failed: ${res.status}`, res);
	}

	const entries: Array<{
		name: string;
		type: 'file' | 'dir';
		download_url: string | null;
	}> = await res.json();

	const jsonFiles = entries.filter(
		(e) => e.type === 'file' && e.name.endsWith('.json') && e.download_url
	);

	// Fetch & parse the JSON files
	return await Promise.all(
		jsonFiles.map(async (f) => {
			const r = await fetch(f.download_url!);
			if (!r.ok) throw new Error(`Download failed for ${f.name}`);
			return await r.json();
		})
	);
}

async function fetchSingleArticleMetadata(url: string, fetch: any, etag?: string) {
	const response = await fetch(url, {
		headers: {
			...(etag ? { 'If-None-Match': etag } : {})
		}
	});

	if (!response.ok) {
		throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
	}

	console.log('[fetchArticleMetadata] Fetched article metadata successfully:', url);
	return await response.json();
}
