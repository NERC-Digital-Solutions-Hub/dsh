import type { CustomRenderers } from '$lib/Types/custom-renderers';

/**
 * Hook used to fetch the custom renderers config from a given URL.
 * @param url The URL to fetch the custom renderers config from.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchCustomRenderers(url: string) {
	let content = $state<CustomRenderers | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch custom renderers manifest: ${response.status} ${response.statusText}`
				);
			}

			content = (await response.json()) as CustomRenderers;
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
