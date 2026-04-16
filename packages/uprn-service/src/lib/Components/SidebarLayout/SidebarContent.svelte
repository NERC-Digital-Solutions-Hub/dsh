<script lang="ts">
	import { cn } from '$lib/utils';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
	};

	const { class: className, children }: Props = $props();
</script>

<!-- Scrollable content section -->
<div class={cn('flex flex-col w-full flex-1 overflow-hidden pr-1.5 pl-1.5', className)}>
	{#if children}
		{@render children()}
	{/if}
</div>
