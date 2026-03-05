<script lang="ts">
	import ChatFeedbackDialog from '$lib/Components/Chat/ChatFeedbackDialog.svelte';
	import { Button } from '$lib/Components/shadcn/button';
	import * as Chat from '$lib/Components/shadcn/chat';
	import { Input } from '$lib/Components/shadcn/input';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import { useSubmitAiChatbotChat } from '$lib/Hooks/UseSubmitAiChatbotChat.svelte';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import { cn } from '$lib/utils';
	import { SendIcon, ThumbsUp, ThumbsDown } from '@lucide/svelte';

	// ============================================================================
	// Types
	// ============================================================================

	/**
	 * Props interface for the chat component.
	 */
	type Props = {
		chatEndpoint: string;
		feedbackEndpoint: string;
		getTabState: () => AppTabState;
		class?: string;
	};

	/**
	 * Represents a single chat message in the conversation.
	 */
	type FeedbackVote = 'up' | 'down' | null;

	type ChatMessage = {
		/** Unique identifier for the message */
		id: number;
		/** Unique identifier for the message sender (1 = bot, 2 = user) */
		senderId: 1 | 2;
		/** The text content of the message */
		message: string;
		/** Formatted timestamp when the message was sent */
		sentAt: string;
		/** Current feedback vote for this message */
		feedbackVote: FeedbackVote;
		/** Session identifier used for feedback submission */
		sessionId?: string;
		/** Sequence number used for feedback submission */
		sequenceNumber?: number;
	};

	// ============================================================================
	// Constants
	// ============================================================================

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

	/** Initial greeting message from the bot */
	const INITIAL_GREETING = `How can I help?`;

	// ============================================================================
	// Component Props
	// ============================================================================

	const { chatEndpoint, feedbackEndpoint, getTabState, class: className }: Props = $props();

	/** Hook for the AI UPRN chatbot streaming endpoint. */
	const chat = $derived.by(() => {
		return chatEndpoint ? useSubmitAiChatbotChat(chatEndpoint) : null;
	});

	// ============================================================================
	// State
	// ============================================================================

	/** Current message being typed by the user */
	let message = $state('');

	/** State for managing the visibility of the feedback dialog */
	let isFeedbackDialogOpen = $state(false);

	/** Session id for the bot message currently being reported */
	let selectedFeedbackSessionId = $state<string | null>(null);

	/** Sequence number for the bot message currently being reported */
	let selectedFeedbackSequenceNumber = $state<number | null>(null);

	/** Selected predefined feedback option for dialog */
	let selectedFeedbackOption = $state<string | null>(null);

	/** Reference to the scroll container element */
	let scrollContainer: HTMLDivElement | null = $state(null);

	/** Reference to the form input element */
	let formElement: HTMLFormElement | null = $state(null);

	/** Reference to the input element */
	let inputRef: HTMLInputElement | null = $state(null);

	/** Reference to the message wrapper element for dynamic padding */
	let messageWrapper: HTMLDivElement | null = $state(null);

	/** Array of all messages in the chat conversation */
	let messageIdCounter = 1;

	const messages = $state<ChatMessage[]>([
		{
			id: messageIdCounter++,
			senderId: BOT_SENDER_ID,
			message: INITIAL_GREETING,
			sentAt: formatShortTime(new Date()),
			feedbackVote: null
		}
	]);

	// ============================================================================
	// Dynamic Height Effect
	// ============================================================================

	/**
	 * Updates the message wrapper's bottom padding based on the form's height.
	 */
	$effect(() => {
		if (formElement && messageWrapper) {
			// Capture references in local constants to satisfy TypeScript
			const form = formElement;
			const wrapper = messageWrapper;

			const updatePadding = () => {
				const formHeight = form.offsetHeight;
				wrapper.style.paddingBottom = `${formHeight}px`;
			};

			// Initial update
			updatePadding();

			// Update on resize
			const resizeObserver = new ResizeObserver(updatePadding);
			resizeObserver.observe(form);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	// ============================================================================
	// Auto-scroll Effect
	// ============================================================================

	/**
	 * Automatically scrolls to the bottom when messages change or streaming updates occur.
	 */
	$effect(() => {
		messages.length;
		chat?.content;

		// Scroll to bottom after a small delay to ensure DOM has updated
		if (scrollContainer) {
			setTimeout(() => {
				// Find the viewport element within the ScrollArea
				const viewport = scrollContainer?.querySelector('[data-slot="scroll-area-viewport"]');
				if (viewport) {
					viewport.scrollTop = viewport.scrollHeight;
				}
			}, 0);
		}
	});

	// ============================================================================
	// Helper Functions
	// ============================================================================

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
			feedbackVote: null,
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

	/**
	 * Handles feedback thumb selection for a bot message.
	 * Only one thumb can be active at a time, and clicking an active thumb clears it.
	 */
	function handleThumbVote(message: ChatMessage, vote: Exclude<FeedbackVote, null>): void {
		const nextVote: FeedbackVote = message.feedbackVote === vote ? null : vote;
		message.feedbackVote = nextVote;

		if (nextVote === 'down' && message.sessionId && message.sequenceNumber) {
			selectedFeedbackSessionId = message.sessionId;
			selectedFeedbackSequenceNumber = message.sequenceNumber;
			selectedFeedbackOption = null;
			isFeedbackDialogOpen = true;
		}
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================

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
			await chat?.submit(userMessage, getTabState());

			if (!chat?.error && chat?.content) {
				addMessage(chat.content.answer, BOT_SENDER_ID, {
					sessionId: responseSessionId,
					sequenceNumber: responseSequenceNumber
				});
			} else {
				addMessage(ERROR_MESSAGE, BOT_SENDER_ID);
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

<!-- ============================================================================ -->
<!-- Chat Container -->
<!-- ============================================================================ -->

<div class={cn('chat-container h-full w-full border border-border', className)}>
	<div class="message-wrapper" bind:this={messageWrapper}>
		<ScrollArea class="h-full w-full" bind:ref={scrollContainer}>
			<Chat.List>
				{#each messages as m (m.id)}
					<Chat.Bubble variant={m.senderId === USER_SENDER_ID ? 'sent' : 'received'}>
						<Chat.BubbleAvatar />
						<Chat.BubbleMessage class="flex flex-col gap-1">
							{@html m.message}
							<div
								class="flex w-full items-center justify-between gap-2 text-xs group-data-[variant='sent']/chat-bubble:justify-end"
							>
								<span>{m.sentAt}</span>

								{#if m.senderId === BOT_SENDER_ID && m.sessionId && m.sequenceNumber}
									<div class="thumb-actions">
										<div class="thumb-wrapper" class:visible={m.feedbackVote !== 'down'}>
											<div class="thumb-inner">
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													class={cn(
														'thumb-button group',
														m.feedbackVote === 'up' && 'thumb-active'
													)}
													onclick={() => handleThumbVote(m, 'up')}
													aria-label="Helpful response"
												>
													<ThumbsUp
														class={cn(
															'thumb-icon',
															m.feedbackVote === 'up' ? 'text-foreground' : 'text-muted-foreground'
														)}
													/>
												</Button>
											</div>
										</div>

										<div class="thumb-wrapper" class:visible={m.feedbackVote !== 'up'}>
											<div class="thumb-inner">
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													class={cn(
														'thumb-button group',
														m.feedbackVote === 'down' && 'thumb-active'
													)}
													onclick={() => handleThumbVote(m, 'down')}
													aria-label="Unhelpful response"
												>
													<ThumbsDown
														class={cn(
															'thumb-icon',
															m.feedbackVote === 'down'
																? 'text-foreground'
																: 'text-muted-foreground'
														)}
													/>
												</Button>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</Chat.BubbleMessage>
					</Chat.Bubble>
				{/each}

				{#if chat?.isLoading}
					<Chat.Bubble variant="received">
						<Chat.BubbleAvatar />
						<Chat.BubbleMessage class="flex flex-col gap-1">
							{#if chat?.content}
								<p class="break-words whitespace-pre-wrap">{@html chat.content}</p>
							{:else}
								<Chat.BubbleMessage typing />
							{/if}
						</Chat.BubbleMessage>
					</Chat.Bubble>
				{/if}
			</Chat.List>
		</ScrollArea>
	</div>

	<div class="input-wrapper">
		<form
			bind:this={formElement}
			onsubmit={handleSubmit}
			class="flex shrink-0 items-center gap-2 border-t border-border bg-background p-2"
		>
			<Input
				bind:ref={inputRef}
				bind:value={message}
				class="rounded-full"
				placeholder="Type a message..."
				disabled={chat?.isLoading}
			/>
			<Button
				type="submit"
				variant="default"
				size="icon"
				class="shrink-0 rounded-full"
				disabled={message.trim() === '' || chat?.isLoading}
			>
				<SendIcon />
			</Button>
		</form>
	</div>
</div>

<style>
	.chat-container {
		position: relative;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.input-wrapper {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
		background: inherit;
	}

	.message-wrapper {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.thumb-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.thumb-wrapper {
		display: grid;
		grid-template-columns: 0fr;
		transition: grid-template-columns 0.2s ease-out;
	}

	.thumb-wrapper.visible {
		grid-template-columns: 1fr;
	}

	.thumb-inner {
		overflow: hidden;
		display: flex;
		opacity: 0;
		transform: translateX(10px);
		transition:
			opacity 0.2s ease-out,
			transform 0.2s ease-out;
	}

	.thumb-wrapper.visible .thumb-inner {
		opacity: 1;
		transform: translateX(0);
	}

	.thumb-button {
		transition: background-color 0.2s ease-out;
	}

	.thumb-button:hover {
		background-color: hsl(var(--muted));
	}

	.thumb-button.thumb-active {
		background-color: hsl(var(--muted));
	}

	.thumb-button.thumb-active:hover {
		background-color: hsl(var(--muted));
	}

	.thumb-icon {
		transition:
			transform 0.2s ease-out,
			color 0.2s ease-out,
			opacity 0.2s ease-out;
	}
</style>
