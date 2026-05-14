import type { ChatbotConfig } from '$lib/Types/Configuration.types';

/**
 * Hook used to fetch the configuration for the AI UPRN chatbot service. It manages the loading state,
 * any errors that occur during the configuration fetch, and the resolved configuration.
 * @param url The URL to the AI UPRN chatbot configuration endpoint.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useFetchAiChatbotConfig(url: string) {
	let content = $state<ChatbotConfig | null>(null);
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

			content = (await response.json()) as ChatbotConfig;
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
