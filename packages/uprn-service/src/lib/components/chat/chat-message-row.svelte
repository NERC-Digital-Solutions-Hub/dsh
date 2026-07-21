<script lang="ts">
	import SanitizedHtml from '$lib/components/sanitized-html/sanitized-html.svelte';
	import Button from '$lib/components/shadcn/button/button.svelte';
	import * as Chat from '$lib/components/shadcn/chat';
	import { Flag } from '@lucide/svelte';
	import type { ChatMessage } from './chat-controller.svelte';

	type Props = {
		message: ChatMessage;
		onReport: (message: ChatMessage) => void;
	};

	const { message, onReport }: Props = $props();
</script>

<Chat.Bubble variant={message.sender === 'user' ? 'sent' : 'received'}>
	<Chat.BubbleMessage class="flex flex-col gap-1">
		<article class="prose-chat-markdown">
			{#if message.sender === 'user'}
				{message.text}
			{:else}
				<SanitizedHtml html={message.html} />
			{/if}
		</article>

		<div
			class="flex w-full items-center justify-between gap-2 text-xs group-data-[variant='sent']/chat-bubble:justify-end"
		>
			<span>{message.sentAt}</span>
			{#if message.sender === 'bot' && !message.isStreaming && message.sessionId && message.sequenceNumber}
				<Button
					variant="link"
					class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					onclick={() => onReport(message)}
				>
					<Flag class="size-3" aria-hidden="true" />
					Report
				</Button>
			{/if}
		</div>
	</Chat.BubbleMessage>
</Chat.Bubble>
