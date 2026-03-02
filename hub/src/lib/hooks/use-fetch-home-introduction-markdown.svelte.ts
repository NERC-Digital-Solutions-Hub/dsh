/**
 * Hook used to fetch the home introduction markdown from a given URL.
 * @param url The URL to fetch the home introduction markdown from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchHomeIntroductionMarkdown(url: string) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		content = null;
		isLoading = true;
		error = null;

		try {
			if (!url) {
				console.warn('No URL provided for fetching home introduction markdown.');
				content = null;
				return;
			}

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch home introduction markdown: ${response.status} ${response.statusText}`
				);
			}

			content = await response.text();
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
