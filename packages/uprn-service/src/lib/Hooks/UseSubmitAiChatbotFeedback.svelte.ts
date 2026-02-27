import { AiChatbotFeedbackType, type AiChatbotFeedbackResponse } from '$lib/Types/Chatbot.types';

/**
 * Hook used to send feedback for a specific chat message to the AI UPRN chatbot service.
 * @param url The URL to the AI UPRN chatbot feedback endpoint.
 * @returns The loading, error, content states as well as a fetch method that accepts a query string.
 */
export function useSubmitAiChatbotFeedback(url: string) {
	let content = $state<AiChatbotFeedbackResponse | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function submit(sessionId: string, sequenceNumber: number, feedback: string) {
		content = null;
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					session_id: sessionId,
					sequence_number: sequenceNumber,
					feedback_text: feedback,
					feedback_type: AiChatbotFeedbackType.Complaint
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to send feedback: ${response.statusText}`);
			}

			content = (await response.json()) as AiChatbotFeedbackResponse;
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
		submit
	};
}
