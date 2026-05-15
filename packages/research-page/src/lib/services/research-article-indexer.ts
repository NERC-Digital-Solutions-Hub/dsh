import type { ArticleMetadata } from '$lib/types/article';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createContentSource,
	resolveContentEnvironment,
	resolveDshContentBaseUrl,
	type ManifestAsset
} from '@dsh/content';
import matter from 'gray-matter';

type Fetch = typeof fetch;

type InitializeOptions = {
	baseUrl?: string | null;
	assetBaseUrl?: string | null;
	environment?: string | null;
	fetch?: Fetch;
};

/**
 * Service to index and retrieve research article metadata.
 */
class ResearchArticleIndexer {
	#isInitialized: boolean = false;
	#articleMetadata: ArticleMetadata[] = [];

	#slugToMetadata: Map<string, ArticleMetadata> = new Map();
	#slugToArticleUrl: Map<string, string> = new Map();

	/**
	 * Initializes the indexer by reading article markdown assets from the content manifest.
	 * @returns void
	 */
	public async initialize(options: InitializeOptions = {}): Promise<void> {
		if (this.#isInitialized) {
			return;
		}

		const contentBaseUrl = resolveDshContentBaseUrl(
			options.baseUrl || DEFAULT_DSH_CONTENT_BASE_URL
		);
		const source = createContentSource({
			baseUrl: contentBaseUrl,
			environment: resolveContentEnvironment(options.environment),
			fetch: options.fetch
		});
		const assetSource = createContentSource({
			baseUrl: resolveDshContentBaseUrl(
				options.assetBaseUrl || options.baseUrl || DEFAULT_DSH_CONTENT_BASE_URL
			),
			environment: resolveContentEnvironment(options.environment),
			fetch: options.fetch
		});
		const page = await source.getPage<Record<string, ManifestAsset>>('/research/articles');
		const articleEntries = Object.entries(page.assets)
			.filter(([key, asset]) => isArticleMarkdownAsset(key, asset))
			.sort(([left], [right]) => left.localeCompare(right));

		this.#articleMetadata = await Promise.all(
			articleEntries.map(async ([key]) => {
				const slug = key;
				const articleUrl = source.resolvePageFileUrl(page, key);
				const assetArticleUrl = assetSource.resolvePageFileUrl(page, key);
				const { metadata, resolvedUrl } = await this.#loadArticleMetadata(
					slug,
					[articleUrl, assetArticleUrl],
					contentBaseUrl,
					options.fetch ?? fetch
				);

				this.#slugToMetadata.set(slug, metadata);

				this.#slugToArticleUrl.set(slug, resolvedUrl);

				return metadata;
			})
		);

		this.#isInitialized = true;
	}

	/**
	 * Gets the metadata for a given article slug.
	 * @param slug The slug of the article.
	 * @returns The metadata for the slug.
	 */
	getMetadataBySlug(slug: string): ArticleMetadata | undefined {
		return this.#slugToMetadata.get(slug);
	}

	/**
	 * Gets all article metadata instances.
	 * @returns The article metadata instances.
	 */
	getAllMetadata(): ArticleMetadata[] {
		return this.#articleMetadata;
	}

	/**
	 * Gets the article markdown URL for a given slug.
	 * @param slug The slug of the article.
	 * @returns The article markdown URL for the slug.
	 */
	getArticleUrlBySlug(slug: string): string | undefined {
		return this.#slugToArticleUrl.get(slug);
	}

	async #loadArticleMetadata(
		slug: string,
		articleUrls: string[],
		contentBaseUrl: string,
		fetchImpl: Fetch
	): Promise<{ metadata: ArticleMetadata; resolvedUrl: string }> {
		const { text, url } = await fetchFirstAvailableArticle(slug, articleUrls, fetchImpl);
		const { content, data } = matter(text);

		return {
			metadata: normalizeArticleMetadata(slug, data, content, contentBaseUrl),
			resolvedUrl: url
		};
	}
}

export const researchArticleIndexer = new ResearchArticleIndexer();

function isArticleMarkdownAsset(key: string, asset: ManifestAsset): boolean {
	if (asset.type !== 'markdown') {
		return false;
	}

	if (key === 'index' || key === 'main') {
		return false;
	}

	return asset.path.endsWith('.md');
}

async function fetchFirstAvailableArticle(
	slug: string,
	urls: string[],
	fetchImpl: Fetch
): Promise<{ text: string; url: string }> {
	const uniqueUrls = [...new Set(urls)];
	const failures: string[] = [];

	for (const url of uniqueUrls) {
		const response = await fetchImpl(url);
		if (response.ok) {
			return { text: await response.text(), url };
		}

		failures.push(`${url}: ${response.status} ${response.statusText}`);
	}

	throw new Error(`Failed to fetch research article "${slug}". Tried ${failures.join('; ')}`);
}
function normalizeArticleMetadata(
	slug: string,
	data: Record<string, unknown>,
	content: string,
	baseUrl: string
): ArticleMetadata {
	const title = readString(data, 'title') || extractTitle(content) || slug;
	const description = readString(data, 'description') || extractDescription(content);
	const date = readString(data, 'date') || '';
	const image = resolveContentRootUrl(readString(data, 'thumbnail'), baseUrl);
	const tags = Array.isArray(data.tags) ? data.tags.filter(isString) : [];
	const hidden = typeof data.hidden === 'boolean' ? data.hidden : false;

	return {
		title,
		description,
		date,
		image,
		tags,
		path: slug,
		hidden
	};
}

function resolveContentRootUrl(path: string, baseUrl: string): string {
	const trimmed = path.trim();
	if (!trimmed) {
		return '';
	}

	try {
		return new URL(trimmed).toString();
	} catch {
		return new URL(trimmed.replace(/^\/+/, ''), baseUrl).toString();
	}
}

function readString(data: Record<string, unknown>, key: string): string {
	const value = data[key];
	if (typeof value === 'string' && value.trim()) {
		return value;
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}

	return '';
}

function extractTitle(content: string): string {
	return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
}

function extractDescription(content: string): string {
	return (
		content
			.split(/\n\s*\n/)
			.map((block) => block.trim())
			.find((block) => block && !block.startsWith('#'))
			?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
			.replace(/[*_`]/g, '')
			.trim() ?? ''
	);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
