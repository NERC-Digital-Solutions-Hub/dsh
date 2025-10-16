<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Chat from '$lib/components/ui/chat';
	import { Input } from '$lib/components/ui/input';
	import SendIcon from '@lucide/svelte/icons/send';
	import { onMount, tick } from 'svelte';

	// Component state
	let message = $state('');
	let container = $state<HTMLDivElement>(); // outer shell (for ResizeObserver)
	let viewport = $state<HTMLDivElement>(); // the scrollable area
	let content = $state<HTMLDivElement>(); // inner content wrapper

	// Whether the user is effectively at the bottom (within a small tolerance).
	let atBottom = $state(true);
	const BOTTOM_TOLERANCE = 8; // px

	// Sample messages for demonstration
	const messages = $state([
		{ senderId: 2, message: 'How do I use the treeview?', sentAt: '10:00 AM' },
		{
			senderId: 1,
			message: 'The UPRN treeview enables you to select and download data...',
			sentAt: '10:01 AM'
		},
		{ senderId: 2, message: 'Can you show me how?', sentAt: '10:02 AM' }
	]);

	/**
	 * Formats a Date object into a short time string (e.g., "10:00 AM").
	 * @param date - The date to format.
	 * @returns The formatted time string.
	 */
	function formatShortTime(date: Date): string {
		const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		return `${time} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
	}

	/**
	 * Checks if the viewport is near the bottom within the tolerance.
	 * @returns True if near bottom, false otherwise.
	 */
	function isNearBottom(): boolean {
		if (!viewport) return true;
		const dist = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
		return dist <= BOTTOM_TOLERANCE;
	}

	/**
	 * Scrolls the viewport to the bottom smoothly or instantly.
	 * @param behavior - The scroll behavior ('smooth' or 'auto').
	 */
	async function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
		await tick();
		if (!viewport) return;
		viewport.scrollTo({ top: viewport.scrollHeight, behavior });
	}

	/**
	 * Handles scroll events to track if the user is at the bottom.
	 */
	function onScroll() {
		atBottom = isNearBottom();
	}

	// When messages change:
	// - If the user is at the bottom, smoothly keep them pinned to the bottom.
	// - If not, do nothing (they're reading history).
	$effect(() => {
		messages.length;
		if (atBottom) scrollToBottom('smooth');
	});

	// Keep bottom in view during resizes and content reflows.
	// If the user is pinned to bottom, we maintain that; otherwise we preserve their current view.
	onMount(() => {
		// Make sure we start at the bottom on first mount.
		scrollToBottom('auto');

		// Observe size of the scrollable viewport (container height changes / layout changes)
		const containerRO = new ResizeObserver(() => {
			if (!viewport) return;
			if (atBottom) {
				// Stay anchored to bottom when the container height changes
				scrollToBottom('smooth');
			}
		});
		if (container) containerRO.observe(container);

		// Observe content height changes (e.g., images load, fonts swap, typing indicator)
		let lastScrollHeight = 0;
		const contentRO = new ResizeObserver(() => {
			if (!viewport) return;

			// If not at bottom, preserve the *visual* position by compensating for height deltas
			const scrollHeight = content?.scrollHeight || 0;
			if (!atBottom) {
				const delta = scrollHeight - lastScrollHeight;
				if (delta !== 0) {
					viewport.scrollTop += delta; // keeps same messages in view
				}
			} else {
				// If pinned to bottom, stay there smoothly
				scrollToBottom('smooth');
			}
			lastScrollHeight = scrollHeight;
		});
		if (content) {
			lastScrollHeight = content.scrollHeight;
			contentRO.observe(content);
		}

		return () => {
			containerRO.disconnect();
			contentRO.disconnect();
		};
	});
</script>

<!--
  Layout: simple flex column.
  The messages area is an overflow-auto div (we control the scroll container directly
  for precise anchoring behavior).
-->
<div bind:this={container} class="flex h-full w-full flex-col border border-border">
	<!-- Messages (fills available space) -->
	<div
		class="flex-1 overflow-auto [scroll-behavior:smooth]"
		bind:this={viewport}
		onscroll={onScroll}
	>
		<!--
		  Content wrapper uses flex + justify-end so the stream sits on the bottom
		  whenever messages are fewer than the viewport height.
		-->
		<div bind:this={content} class="flex min-h-full flex-col justify-end gap-2 p-2">
			<Chat.List>
				{#each messages as m (m)}
					<Chat.Bubble variant={m.senderId === 2 ? 'sent' : 'received'}>
						<Chat.BubbleAvatar />
						<Chat.BubbleMessage class="flex flex-col gap-1">
							<p>{m.message}</p>
							<div class="w-full text-xs group-data-[variant='sent']/chat-bubble:text-end">
								{m.sentAt}
							</div>
						</Chat.BubbleMessage>
					</Chat.Bubble>
				{/each}

				<!-- Example typing indicator; still keeps the bottom anchored -->
				<Chat.Bubble variant="received">
					<Chat.BubbleMessage typing />
				</Chat.Bubble>
			</Chat.List>
		</div>
	</div>

	<!-- Composer (fixed at bottom) -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			if (!message) return;
			messages.push({ message, senderId: 2, sentAt: formatShortTime(new Date()) });
			message = '';
			// If the user was not at bottom (reading history) and they send a message,
			// go to bottom (feels like every AI chat).
			atBottom = true;
			scrollToBottom('smooth');
		}}
		class="flex shrink-0 items-center gap-2 border-t border-border bg-background p-2"
	>
		<Input bind:value={message} class="rounded-full" placeholder="Type a message..." />
		<Button
			type="submit"
			variant="default"
			size="icon"
			class="shrink-0 rounded-full"
			disabled={message === ''}
		>
			<SendIcon />
		</Button>
	</form>
</div>
