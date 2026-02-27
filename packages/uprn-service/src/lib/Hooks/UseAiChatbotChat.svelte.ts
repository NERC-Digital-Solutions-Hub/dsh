import type { AiUprnChatbotResponse } from '$lib/Types/Uprn.types';

/**
 * Hook used to send a chat query to the AI UPRN chatbot and receive a complete response.
 * It manages the loading state, any errors that occur during the request, and the resolved chatbot response.
 * @param url The URL to the AI UPRN chatbot chat endpoint.
 * @returns The loading, error, content states as well as a fetch method that accepts a query string.
 */
export function useAiChatbotChat(url: string) {
	let content = $state<AiUprnChatbotResponse | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync(query: string) {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ query })
			});

			if (!response.ok) {
				throw new Error(`Failed to send chat query: ${response.statusText}`);
			}

			content = (await response.json()) as AiUprnChatbotResponse;
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
