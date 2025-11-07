// src/routes/articles/[slug]/+page.server.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import { rehypeLinksToVideo } from '$lib/utils/rehype-plugins/links-to-video';

type Fetch = {
	(input: URL | RequestInfo, init?: RequestInit): Promise<Response>;
	(input: string | URL | Request, init?: RequestInit): Promise<Response>;
};

export async function markdownToHtml(url: string, fetch: Fetch, setHeaders: any): Promise<any> {
	const { status, text, etag } = await fetchMarkdown(url, fetch);
	if (status === 304) {
		return { html: '', frontmatter: {}, notModified: true };
	}

	// Parse frontmatter & content
	const { content, data: frontmatter } = matter(text!);

	// Build HTML with a unified pipeline
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkFrontmatter, ['yaml'])
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeSlug)
		.use(rehypeLinksToVideo)
		.use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.process(content);

	if (etag) {
		setHeaders({ 'Cache-Control': 's-maxage=300, stale-while-revalidate=86400' });
	}

	return { html: String(file), frontmatter };
}

async function fetchMarkdown(url: string, fetch: Fetch, etag?: string) {
	const response = await fetch(url, {
		headers: {
			...(etag ? { 'If-None-Match': etag } : {})
		}
	});
	if (response.status === 304) {
		return { status: 304 as const };
	}

	if (!response.ok) {
		throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
	}

	console.log('[markdown-to-html] Fetched markdown successfully:', url);
	return {
		status: 200 as const,
		text: await response.text(),
		etag: response.headers.get('etag') ?? undefined
	};
}
