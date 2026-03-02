import type { HomeLocalConfig } from '$lib/types/config.types';

/**
 * Hook used to fetch the home local config JSON from a given URL.
 * @param url The URL to fetch the home local config JSON from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchHomeLocalConfig(url: string) {
	let content = $state<HomeLocalConfig | null>(null);
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
					`Failed to fetch home local config JSON: ${response.status} ${response.statusText}`
				);
			}

			content = await response.json();
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
