import type { AiChatbotChatResponse, AppTabState } from '$lib/Types/Chatbot.types';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * Hook used to send a chat query to the AI UPRN chatbot and receive a complete response.
 * It manages the loading state, any errors that occur during the request, and the resolved chatbot response.
 * @param url The URL to the AI UPRN chatbot chat endpoint.
 * @returns The loading, error, content states as well as a fetch method that accepts a query string.
 */
export function useSubmitAiChatbotChat(url: string) {
	let content = $state<string | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	const conversationId: string = crypto.randomUUID().toString();
	let sequenceNumber: number = 1;

	async function submit(query: string, tabState: AppTabState) {
		content = '';
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: query,
					conversation_id: conversationId,
					sequence_number: sequenceNumber,
					state: tabState
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to send chat query: ${response.statusText}`);
			}

			const json = (await response.json()) as AiChatbotChatResponse;
			content = await parseMarkdownToHtml(json.answer);
			sequenceNumber++;
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
		get conversationId() {
			return conversationId;
		},
		get sequenceNumber() {
			return sequenceNumber;
		},
		submit
	};
}

/**
 * Gets the response body from the response as a string.
 * @param response The response with the body.
 * @returns The parsed body.
 */
async function getResponseBody(response: Response, content: string): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error('No response body reader available');
	}

	const decoder = new TextDecoder();
	let done = false;

	while (!done) {
		const { value, done: readerDone } = await reader.read();
		done = readerDone;

		if (value) {
			const chunk = decoder.decode(value, { stream: !done });
			content += chunk;
			content = await parseMarkdownToHtml(content);
		}
	}

	return content;
}

/**
 * Parses markdown into HTML.
 * @param markdown - The markdown as a string.
 * @returns The HTML representation of the markdown.
 */
async function parseMarkdownToHtml(markdown: string): Promise<string> {
	const htmlRaw = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(markdown);

	return htmlRaw.toString();
}
