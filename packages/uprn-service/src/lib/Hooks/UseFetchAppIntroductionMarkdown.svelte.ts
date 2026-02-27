/**
 * Hook used to fetch the app introduction markdown from a given URL.
 * @param url The URL to fetch the app introduction markdown from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchAppIntroductionMarkdown(url: string) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch app introduction markdown: ${response.status} ${response.statusText}`
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
