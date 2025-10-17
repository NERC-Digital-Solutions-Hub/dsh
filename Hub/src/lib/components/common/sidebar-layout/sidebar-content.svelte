<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	const { children }: Props = $props();
</script>

<!-- Scrollable content section -->
<div class="w-full flex-1 overflow-hidden">
	<ScrollArea class="h-full w-full">
		<div class="min-w-0 space-y-2 overflow-hidden p-4">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</ScrollArea>
</div>
