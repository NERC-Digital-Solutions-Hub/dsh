<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Chat from '$lib/components/ui/chat';
	import { Input } from '$lib/components/ui/input';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import SendIcon from '@lucide/svelte/icons/send';
	import { tick } from 'svelte';

	let message = $state('');
	let bottomElement = $state<HTMLDivElement>();

	const messages = $state([
		{
			senderId: 2,
			message: 'How do I use the treeview?',
			sentAt: '10:00 AM'
		},
		{
			senderId: 1,
			message: 'The UPRN treeview enables you to select and download data...',
			sentAt: '10:01 AM'
		},
		{
			senderId: 2,
			message: 'Can you show me how?',
			sentAt: '10:02 AM'
		}
	]);

	// Simple function to scroll to bottom
	async function scrollToBottom() {
		await tick();
		bottomElement?.scrollIntoView({ behavior: 'smooth' });
	}

	function formatShortTime(date: Date): string {
		const time: string = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const hours = date.getHours();
		if (hours >= 12) {
			return time + ' PM';
		} else {
			return time + ' AM';
		}

		return time;
	}

	// Auto-scroll when messages change
	$effect(() => {
		messages.length;
		scrollToBottom();
	});
</script>

<div class="flex h-full w-full flex-col border border-border">
	<!-- Scrollable chat messages area - takes up available space -->
	<div class="flex-1 overflow-hidden">
		<ScrollArea class="h-full">
			<Chat.List>
				{#each messages as message (message)}
					<Chat.Bubble variant={message.senderId === 2 ? 'sent' : 'received'}>
						<Chat.BubbleAvatar></Chat.BubbleAvatar>
						<Chat.BubbleMessage class="flex flex-col gap-1">
							<p>{message.message}</p>
							<div class="w-full text-xs group-data-[variant='sent']/chat-bubble:text-end">
								{message.sentAt}
							</div>
						</Chat.BubbleMessage>
					</Chat.Bubble>
				{/each}
				<Chat.Bubble variant="received">
					<Chat.BubbleMessage typing />
				</Chat.Bubble>
				<!-- Invisible anchor element for scrolling -->
				<div bind:this={bottomElement}></div>
			</Chat.List>
		</ScrollArea>
	</div>

	<!-- Fixed input form at the bottom -->
	<form
		onsubmit={(e) => {
			e.preventDefault();

			messages.push({ message, senderId: 2, sentAt: formatShortTime(new Date()) });

			message = '';
		}}
		class="flex shrink-0 place-items-center gap-2 border-t border-border bg-background p-2"
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
