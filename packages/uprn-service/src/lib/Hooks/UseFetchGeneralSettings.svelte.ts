import type { GeneralRemoteSettings } from '$lib/Types/Configuration.types';

/**
 * Hook used to fetch the general settings for the UPRN service. It manages the loading state,
 * any errors that occur during the settings fetch, and the resolved settings.
 * @param url The URL to the general settings endpoint.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchGeneralSettings(url: string) {
	let content = $state<GeneralRemoteSettings | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Configuration fetch failed: ${response.statusText}`);
			}

			content = (await response.json()) as GeneralRemoteSettings;
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
