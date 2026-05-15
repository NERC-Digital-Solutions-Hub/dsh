export const DEFAULT_CONTENT_ENVIRONMENT = 'production';
export const DEFAULT_DSH_CONTENT_BASE_URL =
	'https://nerc-digital-solutions-hub.github.io/dsh-content/';

export type FetchLike = typeof fetch;
export type ContentEnvironment = string;

export type ContentSourceOptions = {
	environment?: string | null;
	baseUrl?: string | null;
	contentBaseUrl?: string | null;
	fetch?: FetchLike;
};

export type ManifestAsset = {
	path: string;
	type: string;
};

export type ManifestPage<
	TAssets extends Record<string, ManifestAsset> = Record<string, ManifestAsset>
> = {
	route: string;
	assets: TAssets;
};

export type SiteManifest = {
	schemaVersion?: number;
	version: string;
	generatedAt?: string;
	environment: string;
	pages: Record<string, ManifestPage>;
};

export type ContentSource = {
	environment: string;
	baseUrl: string;
	fetchManifest(): Promise<SiteManifest>;
	getPage<TAssets extends Record<string, ManifestAsset> = Record<string, ManifestAsset>>(
		route: string
	): Promise<ManifestPage<TAssets>>;
	readText(
		page: ManifestPage,
		key: string,
		options?: { rewriteRelativePaths?: boolean }
	): Promise<string>;
	readJson<T>(page: ManifestPage, key: string): Promise<T>;
	resolvePageFileUrl(page: ManifestPage, key: string): string;
	resolveContentUrl(path: string): string;
};

export function createContentSource(options: ContentSourceOptions = {}): ContentSource {
	const environment = resolveContentEnvironment(options.environment);
	const baseUrl = resolveDshContentBaseUrl(options.baseUrl ?? options.contentBaseUrl);
	const fetchImpl = options.fetch ?? fetch;

	let manifestPromise: Promise<SiteManifest> | null = null;

	const source: ContentSource = {
		environment,
		baseUrl,
		fetchManifest() {
			manifestPromise ??= fetchSiteManifest({ environment, baseUrl, fetch: fetchImpl });
			return manifestPromise;
		},
		async getPage<TAssets extends Record<string, ManifestAsset> = Record<string, ManifestAsset>>(
			route: string
		) {
			const manifest = await source.fetchManifest();
			const page = getManifestPages(manifest).find((item) => item.route === route);
			if (!page) {
				throw new Error(`Content page "${route}" was not found in the manifest.`);
			}

			return page as ManifestPage<TAssets>;
		},
		async readText(page, key, options = {}) {
			const url = source.resolvePageFileUrl(page, key);
			const text = await fetchText(url, fetchImpl);
			return options.rewriteRelativePaths === false
				? text
				: rewriteRelativeMarkdownPaths(text, getDirectoryUrl(url));
		},
		async readJson<T>(page: ManifestPage, key: string) {
			return await fetchJson<T>(source.resolvePageFileUrl(page, key), fetchImpl);
		},
		resolvePageFileUrl(page, key) {
			return resolvePageFileUrl(baseUrl, page, key);
		},
		resolveContentUrl(path) {
			return new URL(path.replace(/^\/+/, ''), baseUrl).toString();
		}
	};

	return source;
}

export function resolveContentEnvironment(environment?: string | null): string {
	const trimmed = environment?.trim();
	return trimmed || DEFAULT_CONTENT_ENVIRONMENT;
}

export function resolveDshContentBaseUrl(contentBaseUrl?: string | null): string {
	const trimmed = contentBaseUrl?.trim() || DEFAULT_DSH_CONTENT_BASE_URL;
	return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export async function fetchText(url: string, fetchImpl: FetchLike = fetch): Promise<string> {
	const response = await fetchImpl(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch text content from ${url}: ${response.status} ${response.statusText}`
		);
	}

	return await response.text();
}

export async function fetchJson<T>(url: string, fetchImpl: FetchLike = fetch): Promise<T> {
	const response = await fetchImpl(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch JSON content from ${url}: ${response.status} ${response.statusText}`
		);
	}

	return (await response.json()) as T;
}

export function rewriteRelativeMarkdownPaths(markdown: string, pageBaseUrl: string): string {
	const rewrittenInlineMarkdown = markdown.replace(
		/(!?\[[^\]]*\]\()([^)]+)(\))/g,
		(_match, prefix: string, target: string, suffix: string) => {
			return `${prefix}${rewriteMarkdownLinkTarget(target, pageBaseUrl)}${suffix}`;
		}
	);

	const rewrittenReferenceMarkdown = rewrittenInlineMarkdown.replace(
		/^(\s{0,3}\[[^\]]+\]:\s*)(\S+)(.*)$/gm,
		(_match, prefix: string, target: string, suffix: string) => {
			return `${prefix}${rewriteRelativeUrl(target, pageBaseUrl)}${suffix}`;
		}
	);

	return rewrittenReferenceMarkdown.replace(
		/(<(?:img|a)\b[^>]*\s(?:src|href)=["'])([^"']+)(["'][^>]*>)/gi,
		(_match, prefix: string, target: string, suffix: string) => {
			return `${prefix}${rewriteRelativeUrl(target, pageBaseUrl)}${suffix}`;
		}
	);
}

type ResolvedSourceOptions = {
	environment: string;
	baseUrl: string;
	fetch: FetchLike;
};

async function fetchSiteManifest(options: ResolvedSourceOptions): Promise<SiteManifest> {
	const manifestUrl = new URL(
		`manifest.${encodeURIComponent(options.environment)}.json`,
		options.baseUrl
	).toString();

	return await fetchJson<SiteManifest>(manifestUrl, options.fetch);
}

function resolvePageFileUrl(baseUrl: string, page: ManifestPage, key: string): string {
	const path = resolvePageFilePath(page, key);
	return new URL(`pages/${path.replace(/^\/+/, '')}`, baseUrl).toString();
}

function resolvePageFilePath(page: ManifestPage, key: string): string {
	if (!page.assets || typeof page.assets !== 'object') {
		throw new Error(`Content page "${page.route}" does not define an assets map.`);
	}

	const asset = page.assets[key];
	if (asset?.path?.trim()) {
		return asset.path;
	}

	throw new Error(`Content page "${page.route}" does not define a file at key "${key}".`);
}

function getManifestPages(manifest: SiteManifest): ManifestPage[] {
	if (Array.isArray(manifest.pages) || !manifest.pages || typeof manifest.pages !== 'object') {
		throw new Error('Content manifest must define pages as a keyed object.');
	}

	return Object.values(manifest.pages);
}

function getDirectoryUrl(url: string): string {
	const parsed = new URL(url);
	parsed.pathname = parsed.pathname.replace(/[^/]*$/, '');
	return parsed.toString();
}

function rewriteMarkdownLinkTarget(target: string, pageBaseUrl: string): string {
	const leadingWhitespace = target.match(/^\s*/)?.[0] ?? '';
	const trailingWhitespace = target.match(/\s*$/)?.[0] ?? '';
	const trimmedTarget = target.trim();

	if (!trimmedTarget) {
		return target;
	}

	if (trimmedTarget.startsWith('<')) {
		const closingBracketIndex = trimmedTarget.indexOf('>');
		if (closingBracketIndex > 0) {
			const rawUrl = trimmedTarget.slice(1, closingBracketIndex);
			const remainder = trimmedTarget.slice(closingBracketIndex + 1);
			return `${leadingWhitespace}<${rewriteRelativeUrl(rawUrl, pageBaseUrl)}>${remainder}${trailingWhitespace}`;
		}
	}

	const firstWhitespaceIndex = trimmedTarget.search(/\s/);
	if (firstWhitespaceIndex === -1) {
		return `${leadingWhitespace}${rewriteRelativeUrl(trimmedTarget, pageBaseUrl)}${trailingWhitespace}`;
	}

	const rawUrl = trimmedTarget.slice(0, firstWhitespaceIndex);
	const remainder = trimmedTarget.slice(firstWhitespaceIndex);
	return `${leadingWhitespace}${rewriteRelativeUrl(rawUrl, pageBaseUrl)}${remainder}${trailingWhitespace}`;
}

function rewriteRelativeUrl(url: string, pageBaseUrl: string): string {
	if (!isRelativePath(url)) {
		return url;
	}

	try {
		return new URL(url, pageBaseUrl).toString();
	} catch {
		return url;
	}
}

function isRelativePath(value: string): boolean {
	return !/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#)/i.test(value);
}
