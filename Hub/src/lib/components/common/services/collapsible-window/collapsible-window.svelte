<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { scale } from 'svelte/transition';
	import { ChevronDown, ChevronUp, Maximize, Minimize } from '@lucide/svelte';

	type Props = {
		/** Whether the window is collapsed on initialisation. */
		isCollapsedOnInit?: boolean;
		children?: Snippet;
	};

	const { isCollapsedOnInit = true, children }: Props = $props();

	let isCollapsed = $state<boolean>(isCollapsedOnInit);
	let isMaximised = $state<boolean>(false);

	let cardElement: HTMLElement;
	let lastExpandedWindowHeight: string = '300px';
	let collapsedWindowHeight: string = '100px';

	function onToggleCollapse() {
		isCollapsed = !isCollapsed;
		isMaximised = false;
		if (!isCollapsed) {
			// Restore to last normal height when expanding
			collapsedWindowHeight = cardElement.style.height;
			cardElement.style.height = lastExpandedWindowHeight;
		} else {
			cardElement.style.height = collapsedWindowHeight;
		}
	}

	function onToggleMaximise() {
		isMaximised = !isMaximised;
		if (isMaximised) {
			lastExpandedWindowHeight = cardElement.style.height;
			cardElement.style.height = '100%';
		} else {
			cardElement.style.height = lastExpandedWindowHeight;
		}
	}
</script>

<div bind:this={cardElement}>
	<Card.Root class="h-full w-full gap-0 rounded-br-none rounded-bl-none py-0 pt-0 pb-0">
		<Card.Header class="pt-2">
			<div class="flex w-full items-center justify-between">
				<div class="font-medium">Chat</div>
				<div class="flex gap-1">
					{#if !isCollapsed}
						<Button size="sm" onclick={onToggleMaximise}>
							{#if isMaximised}
								<Minimize />
							{:else}
								<Maximize />
							{/if}
						</Button>
					{/if}
					<Button size="sm" onclick={onToggleCollapse}>
						{#if isCollapsed}
							<ChevronUp />
						{:else}
							<ChevronDown />
						{/if}
					</Button>
				</div>
			</div>
		</Card.Header>
		{#if !isCollapsed}
			<Card.Content class="h-full min-h-[10px] w-full p-0">
				{@render children?.()}
			</Card.Content>
		{/if}
	</Card.Root>
</div>
