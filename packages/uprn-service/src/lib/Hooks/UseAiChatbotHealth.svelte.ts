/**
 * Hook used to check the health status of the AI UPRN chatbot service. It manages the loading state,
 * any errors that occur during the health check, and the resolved health status.
 * @param url The URL to the AI UPRN chatbot health endpoint.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useAiChatbotHealth(url: string) {
	let content = $state<boolean | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Health check failed: ${response.statusText}`);
			}

			const data = await response.json();
			content = data.status === 'ok';
		} catch (err) {
			error = err;
			content = false;
		} finally {
			isLoading = false;
		}
	}

	return {
		get isAccessible() {
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
