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

<Tabs.Content {value} class="w-full">
	<Card.Root class="w-full overflow-hidden">
		<Card.Content class="card-content overflow-hidden p-0">
			<ScrollArea class="h-[400px] w-full">
				<div class="min-w-0 space-y-2 overflow-hidden p-4">
					{@render children?.()}
				</div>
			</ScrollArea>
		</Card.Content>
		{#if footer}
			<Card.Footer class="flex items-center justify-between">
				{@render footer()}
			</Card.Footer>
		{/if}
	</Card.Root>
</Tabs.Content>
