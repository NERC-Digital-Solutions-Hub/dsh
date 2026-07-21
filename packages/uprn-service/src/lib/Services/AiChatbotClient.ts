import {
	AiChatbotFeedbackType,
	type AiChatbotChatResponse,
	type AiChatbotFeedbackResponse,
	type AiUprnChatbotEndpoints,
	type AppTabState
} from '$lib/Types/Chatbot.types';

export class AiChatbotClient {
	constructor(
		private readonly endpoints: AiUprnChatbotEndpoints,
		private readonly fetchImpl: typeof fetch = fetch
	) {}

	public async isHealthy(): Promise<boolean> {
		const response = await this.fetchImpl(this.url(this.endpoints.healthRoute));
		if (!response.ok) return false;
		const body = (await response.json()) as { status?: unknown };
		return body.status === 'ok';
	}

	public async submitChat(
		query: string,
		conversationId: string,
		sequenceNumber: number,
		state: AppTabState
	): Promise<AiChatbotChatResponse> {
		return this.postJson<AiChatbotChatResponse>(this.endpoints.chatRoute, {
			query,
			conversation_id: conversationId,
			sequence_number: sequenceNumber,
			state
		});
	}

	public async submitFeedback(
		conversationId: string,
		sequenceNumber: number,
		feedback: string
	): Promise<AiChatbotFeedbackResponse> {
		return this.postJson<AiChatbotFeedbackResponse>(this.endpoints.feedbackRoute, {
			conversation_id: conversationId,
			sequence_number: sequenceNumber,
			feedback_text: feedback,
			feedback_type: AiChatbotFeedbackType.Complaint
		});
	}

	private async postJson<T>(route: string, body: unknown): Promise<T> {
		const response = await this.fetchImpl(this.url(route), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error(response.statusText || `Request failed (${response.status})`);
		return (await response.json()) as T;
	}

	private url(route: string): string {
		return `${this.endpoints.baseUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;
	}
}
