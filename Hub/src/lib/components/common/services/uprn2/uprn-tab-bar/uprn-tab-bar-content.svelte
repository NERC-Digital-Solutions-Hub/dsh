<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string;
		children?: Snippet;
		footer?: Snippet;
	};

	const { value, children, footer }: Props = $props();
</script>

<Tabs.Content {value} class="flex min-h-0 flex-1 flex-col">
	<Card.Content class="card-content flex min-h-0 flex-1 flex-col overflow-hidden p-0">
		<ScrollArea class="h-full w-full">
			<div class="min-w-0 space-y-2 overflow-hidden p-4">
				{@render children?.()}
			</div>
		</ScrollArea>
	</Card.Content>
	{#if footer}
		<Card.Footer class="flex flex-shrink-0 items-center justify-between">
			{@render footer()}
		</Card.Footer>
	{/if}
</Tabs.Content>
