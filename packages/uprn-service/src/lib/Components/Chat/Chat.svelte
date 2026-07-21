<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import { AiChatbotClient } from '$lib/Services/AiChatbotClient';
	import type { AppTabState, AiUprnChatbotEndpoints } from '$lib/Types/Chatbot.types';
	import type { ChatbotConfig } from '$lib/Types/Configuration.types';
	import { cn } from '$lib/utils';

	import ChatFeedbackDialog from './ChatFeedbackDialog.svelte';
	import ChatInput from './ChatInput.svelte';
	import ChatMessageList from './ChatMessageList.svelte';
	import { ChatController, type ChatMessage } from './ChatController.svelte';

	type Props = {
		chatbotConfig: ChatbotConfig;
		endpoints: AiUprnChatbotEndpoints;
		getTabState: () => Promise<AppTabState>;
		class?: string;
	};

	const { chatbotConfig, endpoints, getTabState, class: className }: Props = $props();
	const client = untrack(() => new AiChatbotClient(endpoints));
	const controller = new ChatController(client);

	const feedbackOptions = [
		'Incorrect or incomplete',
		'Not what I asked for',
		'Slow or buggy',
		'Style or tone',
		'Safety or legal concern',
		'Other'
	];

	let message = $state('');
	let feedbackOpen = $state(false);
	let selectedFeedbackSessionId = $state<string | null>(null);
	let selectedFeedbackSequenceNumber = $state<number | null>(null);
	let scrollViewport = $state<HTMLElement | null>(null);
	let shouldAutoScroll = $state(true);
	let lastScrollTop = 0;
	let chatInput = $state<{ focus: () => void } | null>(null);

	onMount(() => {
		void controller.initialize(chatbotConfig.initialMessage);
		return () => controller.destroy();
	});

	$effect(() => {
		const viewport = scrollViewport;
		if (!viewport) return;
		lastScrollTop = viewport.scrollTop;
		const handleScroll = () => {
			const scrolledUp = viewport.scrollTop < lastScrollTop - 2;
			const nearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
			if (scrolledUp) shouldAutoScroll = false;
			else if (nearBottom) shouldAutoScroll = true;
			lastScrollTop = viewport.scrollTop;
		};
		viewport.addEventListener('scroll', handleScroll, { passive: true });
		return () => viewport.removeEventListener('scroll', handleScroll);
	});

	$effect(() => {
		const latestMessage = controller.messages.at(-1);
		void controller.messages.length;
		void controller.isLoading;
		void controller.isAwaitingResponse;
		if (latestMessage?.sender === 'bot') {
			void latestMessage.html;
			void latestMessage.isStreaming;
		}
		if (shouldAutoScroll) void scrollToBottom();
	});

	async function scrollToBottom(): Promise<void> {
		await tick();
		scrollViewport?.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		const query = message.trim();
		if (!query || controller.isLoading) return;
		message = '';
		shouldAutoScroll = true;
		await controller.submit(query, await getTabState());
		setTimeout(() => chatInput?.focus(), 0);
	}

	function report(chatMessage: ChatMessage): void {
		if (chatMessage.sender !== 'bot') return;
		selectedFeedbackSessionId = chatMessage.sessionId ?? null;
		selectedFeedbackSequenceNumber = chatMessage.sequenceNumber ?? null;
		feedbackOpen = true;
	}
</script>

<ChatFeedbackDialog
	bind:isOpen={feedbackOpen}
	{feedbackOptions}
	sessionId={selectedFeedbackSessionId}
	sequenceNumber={selectedFeedbackSequenceNumber}
	onSubmit={(sessionId, sequenceNumber, feedback) =>
		controller.submitFeedback(sessionId, sequenceNumber, feedback)}
/>

<div class={cn('flex h-full min-h-0 w-full flex-col border border-border', className)}>
	<ChatMessageList
		messages={controller.messages}
		isLoading={controller.isLoading}
		isAwaitingResponse={controller.isAwaitingResponse}
		bind:viewportRef={scrollViewport}
		onReport={report}
	/>

	<ChatInput
		bind:this={chatInput}
		bind:value={message}
		disabled={controller.isLoading}
		exampleQuestions={chatbotConfig.exampleQuestions}
		onsubmit={handleSubmit}
	/>
</div>
