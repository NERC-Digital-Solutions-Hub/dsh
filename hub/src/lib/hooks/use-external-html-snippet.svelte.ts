import * as cheerio from 'cheerio';

/**
 * Custom hook to fetch and extract HTML content from an external page based on a CSS selector.
 * @param pageUrl - The URL of the page to fetch.
 * @param selector - The CSS selector to identify the HTML snippet to extract.
 * @returns An object containing the extracted content, any error that occurred, the loading state, and a
 * fetch method.
 */
export function useExternalHtmlSnippet(pageUrl: string, selector: string) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(pageUrl, {
				headers: { 'User-Agent': 'Mozilla/5.0' }
			});

			if (!response.ok) {
				throw new Error(`Failed: ${response.status} ${response.statusText}`);
			}

			const html = await response.text();
			const doc = cheerio.load(html);

			const extracted = doc(selector).first().html() ?? '';
			content = extracted;
		} catch (err) {
			error = err;
			content = null;
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
