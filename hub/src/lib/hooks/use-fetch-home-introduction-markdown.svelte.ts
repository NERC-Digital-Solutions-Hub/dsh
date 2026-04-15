import { SvelteURL } from 'svelte/reactivity';

/**
 * Hook used to fetch the home introduction markdown from a given URL.
 * @param url The URL to fetch the home introduction markdown from.
 * @param pageBaseUrl The base URL for the page.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchHomeIntroductionMarkdown(url: string, pageBaseUrl: string) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		content = null;
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch home introduction markdown: ${response.status} ${response.statusText}`
				);
			}

			const rawMarkdown = await response.text();
			content = rewriteRelativeMarkdownPaths(rawMarkdown, pageBaseUrl);
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	return {
		get content() {
			return content;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		fetch: fetchAsync
	};
}

/**
 * Rewrites relative markdown and HTML URLs to absolute paths using the page base URL.
 */
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
		return new SvelteURL(url, pageBaseUrl).toString();
	} catch {
		return url;
	}
}

function isRelativePath(value: string): boolean {
	return !/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#)/i.test(value);
}
