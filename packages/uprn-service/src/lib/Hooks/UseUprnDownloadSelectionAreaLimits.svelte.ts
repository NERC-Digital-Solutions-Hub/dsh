import type { UrpnDownloadAreaSelectionLimitResponse } from '$lib/Types/Uprn.types';

/**
 * Hook used to fetch the selection area limits for different layers from the UPRN download service.
 * It manages the loading state, any errors that occur during fetching, and the resolved area selection limits.
 * @param url The URL to the UPRN download area selection limits endpoint.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useUprnDownloadSelectionAreaLimits(url: string) {
	let content = $state<UrpnDownloadAreaSelectionLimitResponse[] | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, { credentials: 'include' });

			if (!response.ok) {
				throw new Error(`Failed to get selection area limits: ${response.statusText}`);
			}

			content = (await response.json()) as UrpnDownloadAreaSelectionLimitResponse[];
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
