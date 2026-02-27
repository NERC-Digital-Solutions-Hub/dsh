// /**
//  * Hook used to send a chat query to the AI UPRN chatbot and receive a streaming response.
//  * It manages the loading state, any errors that occur during the stream, and the accumulated streamed content.
//  * Each chunk received from the stream is appended to the content string.
//  * @param url The URL to the AI UPRN chatbot chat stream endpoint.
//  * @returns The loading, error, content states as well as a fetch method that accepts a query string.
//  */
// export function useAiChatbotChatStream(url: string) {
// 	let content = $state<string | null>(null);
// 	let error = $state<unknown>(null);
// 	let isLoading = $state(false);

// 	async function fetchAsync(query: string) {
// 		isLoading = true;
// 		error = null;
// 		content = '';

// 		try {
// 			const response = await fetch(url, {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json'
// 				},
// 				body: JSON.stringify({ query })
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Failed to start chat stream: ${response.statusText}`);
// 			}

// 			const reader = response.body?.getReader();
// 			if (!reader) {
// 				throw new Error('No response body reader available');
// 			}

// 			const decoder = new TextDecoder();
// 			let done = false;

// 			while (!done) {
// 				const { value, done: readerDone } = await reader.read();
// 				done = readerDone;

// 				if (value) {
// 					const chunk = decoder.decode(value, { stream: !done });
// 					content += chunk;
// 				}
// 			}
// 		} catch (err) {
// 			error = err;
// 		} finally {
// 			isLoading = false;
// 		}
// 	}

// 	return {
// 		get content() {
// 			return content;
// 		},
// 		get error() {
// 			return error;
// 		},
// 		get isLoading() {
// 			return isLoading;
// 		},
// 		fetch: fetchAsync
// 	};
// }
