<script lang="ts">
	import * as Chat from '$lib/components/shadcn/chat';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import type { ChatMessage } from './chat-controller.svelte';
	import ChatMessageRow from './chat-message-row.svelte';

	type Props = {
		messages: ChatMessage[];
		isLoading: boolean;
		isAwaitingResponse: boolean;
		viewportRef: HTMLElement | null;
		onReport: (message: ChatMessage) => void;
	};

	let {
		messages,
		isLoading,
		isAwaitingResponse,
		viewportRef = $bindable(null),
		onReport
	}: Props = $props();
</script>

<ScrollArea class="min-h-0 flex-1" bind:viewportRef>
	<div aria-live="polite" aria-busy={isLoading}>
		{#if messages.length === 0 && !isAwaitingResponse}
			<p class="p-4 text-center text-sm text-muted-foreground">Starting chat…</p>
		{:else}
			<Chat.List>
				{#each messages as message (message.id)}
					<ChatMessageRow {message} {onReport} />
				{/each}

				{#if isAwaitingResponse}
					<Chat.Bubble variant="received">
						<Chat.BubbleMessage
							typing
							role="status"
							aria-label="Waiting for assistant response"
							data-slot="chat-waiting-indicator"
						/>
					</Chat.Bubble>
				{/if}
			</Chat.List>
		{/if}
	</div>
</ScrollArea>
