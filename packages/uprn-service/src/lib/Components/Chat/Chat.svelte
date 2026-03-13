<script lang="ts">
	import ChatFeedbackDialog from '$lib/Components/Chat/ChatFeedbackDialog.svelte';
	import ChatInput from '$lib/Components/Chat/ChatInput.svelte';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import * as Chat from '$lib/Components/shadcn/chat';
	import { Input } from '$lib/Components/shadcn/input';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import { useFetchAiChatbotConfig } from '$lib/Hooks/UseFetchAiChatbotConfig.svelte';
	import { useSubmitAiChatbotChat } from '$lib/Hooks/UseSubmitAiChatbotChat.svelte';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import { cn } from '$lib/utils';
	import { SendIcon, Flag } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';

	/**
	 * Represents a single chat message in the conversation.
	 */
	type ChatMessage = {
		/** Unique identifier for the message */
		id: number;
		/** Unique identifier for the message sender (1 = bot, 2 = user) */
		senderId: 1 | 2;
		/** The text content of the message */
		message: string;
		/** The final complete text. */
		fullMessage?: string;
		/** Flag indicating if the message is currently streaming */
		isStreaming?: boolean;
		/** Formatted timestamp when the message was sent */
		sentAt: string;
		/** Session identifier used for feedback submission */
		sessionId?: string;
		/** Sequence number used for feedback submission */
		sequenceNumber?: number;
	};

	type Props = {
		configUrl: string;
		chatEndpoint: string;
		feedbackEndpoint: string;
		getTabState: () => Promise<AppTabState>;
		class?: string;
	};

	const {
		configUrl,
		chatEndpoint,
		feedbackEndpoint,
		getTabState,
		class: className
	}: Props = $props();

	/** Initial greeting message shown by the chatbot */
	const FEEDBACK_OPTIONS = [
		'Incorrect or incomplete',
		'Not what I asked for',
		'Slow or buggy',
		'Style or tone',
		'Safety or legal concern',
		'Other'
	];

	/** Identifier for bot messages */
	const BOT_SENDER_ID = 1;

	/** Identifier for user messages */
	const USER_SENDER_ID = 2;

	/** Default error message shown when AI request fails */
	const ERROR_MESSAGE = 'Sorry, I encountered an error processing your request.';

	const CHARACTERS_PER_SECOND = 25;

	/** Hook for the AI UPRN chatbot streaming endpoint. */
	const chat = $derived.by(() => {
		return chatEndpoint ? useSubmitAiChatbotChat(chatEndpoint) : null;
	});

	/** Hook for fetching the AI UPRN chatbot configuration. */
	const config: ReturnType<typeof useFetchAiChatbotConfig> | null = $derived(
		useFetchAiChatbotConfig(configUrl)
	);

	/** Current message being typed by the user */
	let message: string = $state('');

	/** State for managing the visibility of the feedback dialog */
	let isFeedbackDialogOpen: boolean = $state(false);

	/** Session id for the bot message currently being reported */
	let selectedFeedbackSessionId: string | null = $state(null);

	/** Sequence number for the bot message currently being reported */
	let selectedFeedbackSequenceNumber: number | null = $state(null);

	/** Selected predefined feedback option for dialog */
	let selectedFeedbackOption: string | null = $state(null);

	/** Reference to the scroll container element */
	let scrollContainer: HTMLDivElement | null = $state(null);

	let scrollViewport: HTMLElement | null = $state(null);

	/** Reference to the input element */
	let inputRef: HTMLInputElement | null = $state(null);

	/** Reference to the message wrapper element for dynamic padding */
	let messageWrapper: HTMLDivElement | null = $state(null);

	/** Array of all messages in the chat conversation */
	let messageIdCounter = 1;

	const messages = $state<ChatMessage[]>([]);

	onMount(async () => {
		await config.fetch();
		console.log('Chatbot config loaded:', config.content);
		if (config.content) {
			await streamBotMessage(config.content.initialMessage);
		}
	});

	$effect(() => {
		messages.length;
		chat?.isLoading;
		chat?.content;

		scrollToBottom(true);
	});

	/**
	 * Formats a Date object into a short time string with AM/PM indicator.
	 * Example output: "10:30 AM" or "3:45 PM"
	 *
	 * @param date - The date object to format
	 * @returns Formatted time string in 12-hour format with AM/PM
	 */
	function formatShortTime(date: Date): string {
		const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const period = date.getHours() >= 12 ? 'PM' : 'AM';
		return `${time} ${period}`;
	}

	/**
	 * Creates a new chat message object with the current timestamp.
	 *
	 * @param content - The text content of the message
	 * @param senderId - The ID of the sender (BOT_SENDER_ID or USER_SENDER_ID)
	 * @returns A new ChatMessage object
	 */
	function createMessage(
		content: string,
		senderId: 1 | 2,
		metadata?: { sessionId?: string; sequenceNumber?: number }
	): ChatMessage {
		return {
			id: messageIdCounter++,
			message: content,
			senderId,
			sentAt: formatShortTime(new Date()),
			sessionId: metadata?.sessionId,
			sequenceNumber: metadata?.sequenceNumber
		};
	}

	/**
	 * Adds a message to the conversation history.
	 *
	 * @param content - The text content of the message
	 * @param senderId - The ID of the sender (BOT_SENDER_ID or USER_SENDER_ID)
	 */
	function addMessage(
		content: string,
		senderId: 1 | 2,
		metadata?: { sessionId?: string; sequenceNumber?: number }
	): void {
		messages.push(createMessage(content, senderId, metadata));
	}

	async function streamBotMessage(
		fullHtml: string,
		metadata?: { sessionId?: string; sequenceNumber?: number }
	): Promise<void> {
		messages.push({
			id: messageIdCounter++,
			senderId: BOT_SENDER_ID,
			message: '',
			fullMessage: fullHtml,
			isStreaming: true,
			sentAt: formatShortTime(new Date()),
			sessionId: metadata?.sessionId,
			sequenceNumber: metadata?.sequenceNumber
		});

		const streamingMessage = messages[messages.length - 1];
		const totalVisibleChars = getVisibleTextLength(fullHtml);

		const tickMs = 15;
		let visibleCharsShown = 0;

		await scrollToBottom();

		while (visibleCharsShown < totalVisibleChars) {
			const charsThisTick = Math.max(1, Math.round((CHARACTERS_PER_SECOND * tickMs) / 1000));

			visibleCharsShown = Math.min(totalVisibleChars, visibleCharsShown + charsThisTick);
			streamingMessage.message = htmlUpToVisibleChars(fullHtml, visibleCharsShown);

			await scrollToBottom(false);
			await sleep(tickMs);
		}

		streamingMessage.message = fullHtml;
		streamingMessage.isStreaming = false;
	}

	function getVisibleTextLength(fullHtml: string): number {
		const parser = new DOMParser();
		const doc = parser.parseFromString(fullHtml, 'text/html');
		return doc.body.textContent?.length ?? 0;
	}

	function htmlUpToVisibleChars(fullHtml: string, visibleCharCount: number): string {
		const parser = new DOMParser();
		const doc = parser.parseFromString(fullHtml, 'text/html');

		let remaining = visibleCharCount;

		function walk(node: Node): string {
			if (remaining <= 0) return '';

			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent ?? '';
				if (text.length <= remaining) {
					remaining -= text.length;
					return escapeHtml(text);
				}

				const partial = text.slice(0, remaining);
				remaining = 0;
				return escapeHtml(partial);
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return '';
			}

			const el = node as Element;
			const tag = el.tagName.toLowerCase();

			if (VOID_TAGS.has(tag)) {
				return serializeOpenTag(el);
			}

			let html = serializeOpenTag(el);

			for (const child of Array.from(el.childNodes)) {
				if (remaining <= 0) break;
				html += walk(child);
			}

			html += serializeCloseTag(el);
			return html;
		}

		let result = '';
		for (const child of Array.from(doc.body.childNodes)) {
			if (remaining <= 0) break;
			result += walk(child);
		}

		return result;
	}

	function escapeHtml(text: string): string {
		return text
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	function escapeAttribute(text: string): string {
		return escapeHtml(text);
	}

	function serializeOpenTag(el: Element): string {
		const attrs = Array.from(el.attributes)
			.map((attr) => ` ${attr.name}="${escapeAttribute(attr.value)}"`)
			.join('');

		return `<${el.tagName.toLowerCase()}${attrs}>`;
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

	function serializeCloseTag(el: Element): string {
		const tag = el.tagName.toLowerCase();
		return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
	}

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function handleReport(msg: ChatMessage): void {
		selectedFeedbackSessionId = msg.sessionId ?? null;
		selectedFeedbackSequenceNumber = msg.sequenceNumber ?? null;
		selectedFeedbackOption = null;
		isFeedbackDialogOpen = true;
	}

	async function scrollToBottom(smooth = true) {
		await tick();

		if (!scrollViewport) return;

		scrollViewport.scrollTo({
			top: scrollViewport.scrollHeight,
			behavior: smooth ? 'smooth' : 'auto'
		});
	}

	/**
	 * Handles the form submission when the user sends a message.
	 * Manages the complete flow of:
	 * 1. Adding the user's message to the chat
	 * 2. Calling the AI service with streaming
	 * 3. Displaying the AI response
	 * 4. Handling errors gracefully
	 *
	 * @param event - The form submission event
	 */
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!message.trim() || chat?.isLoading) {
			return;
		}

		const userMessage = message.trim();
		message = '';

		addMessage(userMessage, USER_SENDER_ID);

		const responseSessionId = chat?.conversationId;
		const responseSequenceNumber = chat?.sequenceNumber;

		try {
			await chat?.submit(userMessage, await getTabState());

			if (!chat?.error && chat?.content) {
				await streamBotMessage(chat.content, {
					sessionId: responseSessionId,
					sequenceNumber: responseSequenceNumber
				});
			} else {
				await streamBotMessage(ERROR_MESSAGE);
			}
		} catch (error) {
			console.error('Chat error:', error);
			addMessage(ERROR_MESSAGE, BOT_SENDER_ID);
		} finally {
			setTimeout(() => inputRef?.focus(), 0);
		}
	}
</script>

<ChatFeedbackDialog
	bind:isOpen={isFeedbackDialogOpen}
	feedbackUrl={feedbackEndpoint}
	feedbackOptions={FEEDBACK_OPTIONS}
	sessionId={selectedFeedbackSessionId}
	sequenceNumber={selectedFeedbackSequenceNumber}
	selectedOption={selectedFeedbackOption}
/>

<div class={cn('chat-container h-full w-full border border-border', className)}>
	<div class="message-wrapper" bind:this={messageWrapper}>
		<ScrollArea class="h-full w-full" bind:ref={scrollContainer} bind:viewportRef={scrollViewport}>
			<div class="chat-list-anchor">
				<Chat.List>
					{#each messages as m (m.id)}
						<Chat.Bubble variant={m.senderId === USER_SENDER_ID ? 'sent' : 'received'}>
							<Chat.BubbleMessage class="flex flex-col gap-1">
								<article class="prose prose-chat-markdown">
									{console.log('Rendering message:', m.message)}
									{@html m.message}
								</article>

								<div
									class="flex w-full items-center justify-between gap-2 text-xs group-data-[variant='sent']/chat-bubble:justify-end"
								>
									<span>{m.sentAt}</span>

									{#if m.senderId === BOT_SENDER_ID && !m.isStreaming && m.sessionId && m.sequenceNumber}
										<Button
											variant="link"
											class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
											onclick={() => handleReport(m)}
										>
											<span>Report</span>
											<Flag class="h-3 w-3" />
										</Button>
									{/if}
								</div>
							</Chat.BubbleMessage>
						</Chat.Bubble>
					{/each}

					{#if chat?.isLoading}
						<Chat.Bubble variant="received">
							<Chat.BubbleMessage class="flex flex-col gap-1">
								<Chat.BubbleMessage typing />
							</Chat.BubbleMessage>
						</Chat.Bubble>
					{/if}
				</Chat.List>
			</div>
		</ScrollArea>
	</div>

	<div class="input-wrapper">
		<ChatInput
			bind:value={message}
			disabled={chat?.isLoading}
			onsubmit={handleSubmit}
			exampleQuestions={config.content?.exampleQuestions}
		/>
	</div>
</div>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.message-wrapper {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.input-wrapper {
		flex-shrink: 0;
		background: inherit;
	}

	.chat-list-anchor {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
</style>
