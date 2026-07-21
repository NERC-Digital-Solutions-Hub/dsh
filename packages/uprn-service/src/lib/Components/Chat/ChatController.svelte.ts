import type { AiChatbotClient } from '$lib/Services/AiChatbotClient';
import type { AiChatbotFeedbackResponse, AppTabState } from '$lib/Types/Chatbot.types';
import { renderMarkdownToSanitizedHtml, type SanitizedHtml } from '$lib/Utilities/richText';
import { SvelteDate } from 'svelte/reactivity';

export type ChatMessage =
	| { id: number; sender: 'user'; text: string; sentAt: string }
	| {
			id: number;
			sender: 'bot';
			html: SanitizedHtml;
			isStreaming: boolean;
			sentAt: string;
			sessionId?: string;
			sequenceNumber?: number;
	  };

const ERROR_MESSAGE = 'Sorry, I encountered an error processing your request.';

export class ChatController {
	public messages = $state<ChatMessage[]>([]);
	public isLoading = $state(false);
	public isAwaitingResponse = $state(false);
	public error = $state<unknown>(null);

	private readonly conversationId = crypto.randomUUID();
	private sequenceNumber = 1;
	private messageId = 1;
	private streamGeneration = 0;

	constructor(
		private readonly client: AiChatbotClient,
		private readonly charactersPerSecond = 25
	) {}

	public async initialize(initialMessage: string): Promise<void> {
		if (this.messages.length > 0) return;
		await this.streamBotMarkdown(initialMessage);
	}

	public async submit(query: string, state: AppTabState): Promise<void> {
		const trimmedQuery = query.trim();
		if (!trimmedQuery || this.isLoading) return;

		this.messages.push({
			id: this.messageId++,
			sender: 'user',
			text: trimmedQuery,
			sentAt: formatShortTime(new SvelteDate())
		});

		const sequenceNumber = this.sequenceNumber;
		this.isLoading = true;
		this.isAwaitingResponse = true;
		this.error = null;
		try {
			const response = await this.client.submitChat(
				trimmedQuery,
				this.conversationId,
				sequenceNumber,
				state
			);
			this.sequenceNumber += 1;
			await this.streamBotMarkdown(response.answer, {
				sessionId: this.conversationId,
				sequenceNumber
			});
		} catch (error) {
			this.error = error;
			await this.streamBotMarkdown(ERROR_MESSAGE);
		} finally {
			this.isAwaitingResponse = false;
			this.isLoading = false;
		}
	}

	public async submitFeedback(
		sessionId: string,
		sequenceNumber: number,
		feedback: string
	): Promise<AiChatbotFeedbackResponse> {
		return this.client.submitFeedback(sessionId, sequenceNumber, feedback);
	}

	public destroy(): void {
		this.streamGeneration += 1;
	}

	private async streamBotMarkdown(
		markdown: string,
		metadata?: { sessionId?: string; sequenceNumber?: number }
	): Promise<void> {
		const fullHtml = await renderMarkdownToSanitizedHtml(markdown);
		const generation = ++this.streamGeneration;
		const message: Extract<ChatMessage, { sender: 'bot' }> = {
			id: this.messageId++,
			sender: 'bot',
			html: '' as SanitizedHtml,
			isStreaming: true,
			sentAt: formatShortTime(new SvelteDate()),
			sessionId: metadata?.sessionId,
			sequenceNumber: metadata?.sequenceNumber
		};
		const messageIndex = this.messages.push(message) - 1;
		const streamingMessage = this.messages[messageIndex];
		if (!streamingMessage || streamingMessage.sender !== 'bot') {
			throw new Error('Expected the appended chat message to be a bot message.');
		}
		this.isAwaitingResponse = false;

		const totalVisibleChars = getVisibleTextLength(fullHtml);
		const tickMs = 15;
		let visibleChars = 0;
		while (visibleChars < totalVisibleChars && generation === this.streamGeneration) {
			visibleChars = Math.min(
				totalVisibleChars,
				visibleChars + Math.max(1, Math.round((this.charactersPerSecond * tickMs) / 1000))
			);
			streamingMessage.html = htmlUpToVisibleChars(fullHtml, visibleChars) as SanitizedHtml;
			await new Promise((resolve) => setTimeout(resolve, tickMs));
		}

		if (generation === this.streamGeneration) {
			streamingMessage.html = fullHtml;
			streamingMessage.isStreaming = false;
		}
	}
}

function formatShortTime(date: Date): string {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getVisibleTextLength(html: string): number {
	if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, '').length;
	const document = new DOMParser().parseFromString(html, 'text/html');
	return document.body.textContent?.length ?? 0;
}

function htmlUpToVisibleChars(html: string, visibleCharCount: number): string {
	if (typeof DOMParser === 'undefined') return html;
	const document = new DOMParser().parseFromString(html, 'text/html');
	let remaining = visibleCharCount;

	function walk(node: Node): string {
		if (remaining <= 0) return '';
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? '';
			const partial = text.slice(0, remaining);
			remaining -= partial.length;
			return escapeHtml(partial);
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return '';

		const element = node as Element;
		const tag = element.tagName.toLowerCase();
		const attributes = [...element.attributes]
			.map((attribute) => ` ${attribute.name}="${escapeHtml(attribute.value)}"`)
			.join('');
		const openTag = `<${tag}${attributes}>`;
		if (VOID_TAGS.has(tag)) return openTag;

		let children = '';
		for (const child of element.childNodes) {
			if (remaining <= 0) break;
			children += walk(child);
		}
		return `${openTag}${children}</${tag}>`;
	}

	return [...document.body.childNodes].map(walk).join('');
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);
