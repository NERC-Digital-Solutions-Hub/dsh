import { ConfigTransformer } from './uprn-config/config-transformer';
import { CsvConfigFetcher } from './uprn-config/csv-config-fetcher';
import type {
	HubSettings,
	TreeviewNodeConfig,
	UprnSettings,
	UprnTreeviewLayersPayload
} from './content-types';

export const DEFAULT_CONTENT_ENVIRONMENT = 'production';
export const DEFAULT_DSH_CONTENT_BASE_URL =
	'https://nerc-digital-solutions-hub.github.io/dsh-content/';

type FetchLike = typeof fetch;

type SourceOptions = {
	environment?: string;
	contentBaseUrl?: string;
	fetch?: FetchLike;
};

type ManifestPage = {
	route: string;
	files: Record<string, unknown>;
};

type SiteManifest = {
	version: string;
	environment: string;
	pages: ManifestPage[];
};

type UprnManifestPage = ManifestPage & {
	route: '/apps/uprn-service';
	files: {
		settings: string;
		climatejustRenderers: string;
		generated: {
			manifest: string;
		};
		introduction: string;
	};
};

type HubManifestPage = ManifestPage & {
	route: '/';
	files: {
		introduction: string;
		settings: string;
	};
};

type GeneratedManifest = {
	version: number;
	output: Array<{
		sheet_name: string;
		csv_path: string;
	}>;
};

type ResolvedSourceOptions = {
	environment: string;
	contentBaseUrl: string;
	fetch: FetchLike;
};

export function resolveContentEnvironment(environment?: string | null): string {
	const trimmed = environment?.trim();
	return trimmed || DEFAULT_CONTENT_ENVIRONMENT;
}

export function resolveDshContentBaseUrl(contentBaseUrl?: string | null): string {
	const trimmed = contentBaseUrl?.trim() || DEFAULT_DSH_CONTENT_BASE_URL;
	return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export async function fetchHubIntroduction(options: SourceOptions = {}): Promise<string> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchHubPage(resolved);
	const url = resolvePageFileUrl(resolved.contentBaseUrl, page.files.introduction);
	const markdown = await fetchText(url, resolved.fetch);
	return rewriteRelativeMarkdownPaths(markdown, getDirectoryUrl(url));
}

export async function fetchHubSettings(options: SourceOptions = {}): Promise<HubSettings> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchHubPage(resolved);
	const url = resolvePageFileUrl(resolved.contentBaseUrl, page.files.settings);
	return await fetchJson<HubSettings>(url, resolved.fetch);
}

export async function fetchUprnIntroduction(options: SourceOptions = {}): Promise<string> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchUprnPage(resolved);
	const url = resolvePageFileUrl(resolved.contentBaseUrl, page.files.introduction);
	const markdown = await fetchText(url, resolved.fetch);
	return rewriteRelativeMarkdownPaths(markdown, getDirectoryUrl(url));
}

export async function fetchUprnSettings(options: SourceOptions = {}): Promise<UprnSettings> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchUprnPage(resolved);
	const url = resolvePageFileUrl(resolved.contentBaseUrl, page.files.settings);
	return await fetchJson<UprnSettings>(url, resolved.fetch);
}

export async function fetchUprnCustomRenderers<T = unknown>(
	options: SourceOptions = {}
): Promise<T> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchUprnPage(resolved);
	const url = resolvePageFileUrl(resolved.contentBaseUrl, page.files.climatejustRenderers);
	return await fetchJson<T>(url, resolved.fetch);
}

export async function fetchUprnTreeviewLayersPayload(
	options: SourceOptions = {}
): Promise<UprnTreeviewLayersPayload> {
	const resolved = resolveSourceOptions(options);
	const page = await fetchUprnPage(resolved);
	const generatedManifestUrl = resolvePageFileUrl(
		resolved.contentBaseUrl,
		page.files.generated.manifest
	);
	const generatedManifest = await fetchJson<GeneratedManifest>(
		generatedManifestUrl,
		resolved.fetch
	);

	const foldersCsvUrl = resolveGeneratedCsvUrl(resolved.contentBaseUrl, generatedManifest, 'folders');
	const datasetsCsvUrl = resolveGeneratedCsvUrl(
		resolved.contentBaseUrl,
		generatedManifest,
		'datasets'
	);
	const variablesCsvUrl = resolveGeneratedCsvUrl(
		resolved.contentBaseUrl,
		generatedManifest,
		'variables'
	);

	const configFetcher = new CsvConfigFetcher(datasetsCsvUrl, variablesCsvUrl, foldersCsvUrl);
	const { folders, datasets, variables } = await configFetcher.fetch();
	const configTransformer = new ConfigTransformer();
	const layers = await configTransformer.transform({ folders, datasets, variables });

	return {
		version: generatedManifest.version,
		layers: layers as TreeviewNodeConfig[]
	};
}

export async function fetchUprnTreeviewLayers(
	options: SourceOptions = {}
): Promise<TreeviewNodeConfig[]> {
	const payload = await fetchUprnTreeviewLayersPayload(options);
	return payload.layers;
}

function resolveSourceOptions(options: SourceOptions): ResolvedSourceOptions {
	return {
		environment: resolveContentEnvironment(options.environment),
		contentBaseUrl: resolveDshContentBaseUrl(options.contentBaseUrl),
		fetch: options.fetch ?? fetch
	};
}

async function fetchSiteManifest(options: ResolvedSourceOptions): Promise<SiteManifest> {
	const manifestUrl = new URL(
		`manifest.${encodeURIComponent(options.environment)}.json`,
		options.contentBaseUrl
	).toString();

	return await fetchJson<SiteManifest>(manifestUrl, options.fetch);
}

async function fetchHubPage(options: ResolvedSourceOptions): Promise<HubManifestPage> {
	const manifest = await fetchSiteManifest(options);
	const page = manifest.pages.find((item) => item.route === '/');
	if (!page) {
		throw new Error('Hub page was not found in the dsh-content manifest.');
	}

	return page as HubManifestPage;
}

async function fetchUprnPage(options: ResolvedSourceOptions): Promise<UprnManifestPage> {
	const manifest = await fetchSiteManifest(options);
	const page = manifest.pages.find((item) => item.route === '/apps/uprn-service');
	if (!page) {
		throw new Error('UPRN page was not found in the dsh-content manifest.');
	}

	return page as UprnManifestPage;
}

function resolvePageFileUrl(contentBaseUrl: string, filePath: string): string {
	return new URL(`pages/${filePath.replace(/^\/+/, '')}`, contentBaseUrl).toString();
}

function resolveGeneratedCsvUrl(
	contentBaseUrl: string,
	manifest: GeneratedManifest,
	sheetName: string
): string {
	const output = manifest.output.find((item) => item.sheet_name === sheetName);
	if (!output?.csv_path) {
		throw new Error(`Generated CSV path for "${sheetName}" was not found.`);
	}

	return new URL(output.csv_path, contentBaseUrl).toString();
}

async function fetchText(url: string, fetchImpl: FetchLike): Promise<string> {
	const response = await fetchImpl(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch text content from ${url}: ${response.status} ${response.statusText}`);
	}

	return await response.text();
}

async function fetchJson<T>(url: string, fetchImpl: FetchLike): Promise<T> {
	const response = await fetchImpl(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch JSON content from ${url}: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
}

function getDirectoryUrl(url: string): string {
	const parsed = new URL(url);
	parsed.pathname = parsed.pathname.replace(/[^/]*$/, '');
	return parsed.toString();
}

function rewriteRelativeMarkdownPaths(markdown: string, pageBaseUrl: string): string {
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
