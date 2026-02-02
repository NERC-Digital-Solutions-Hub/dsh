<script lang="ts">
	import { cn } from '$lib/utils';
	import { ScrollArea } from '$lib/components/shadcn/scroll-area';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
	};

	const { class: className, children }: Props = $props();
</script>

<!-- Scrollable content section -->
<div class={cn('w-full flex-1 overflow-hidden pr-1.5 pl-1.5', className)}>
	<ScrollArea class="h-full w-full" type="always">
		<div class="min-w-0 space-y-2 overflow-hidden">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</ScrollArea>
</div>
