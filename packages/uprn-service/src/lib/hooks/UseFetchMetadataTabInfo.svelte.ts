import type { TabsPayload } from '$lib/Types/metadata';

/**
 * Hook used to fetch metadata tab information from a given URL. It manages the loading state, any errors that occur during fetching,
 * and the fetched content itself.
 * @param url The URL to the metadata tab information.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchMetadataTabInfo(url: string) {
	let content = $state<TabsPayload | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch metadata tab info: ${response.statusText}`);
			}

			content = (await response.json()) as TabsPayload;
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
