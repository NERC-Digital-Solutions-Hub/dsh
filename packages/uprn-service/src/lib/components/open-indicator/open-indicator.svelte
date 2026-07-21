<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from '@lucide/svelte';

	type Props = {
		isOpen: boolean;
		class?: string;
	};

	const { isOpen, class: className }: Props = $props();
</script>

<ChevronRight
	class={cn(
		className,
		'h-4 w-4 text-muted-foreground transition-transform duration-200 ease-in-out',
		isOpen ? 'rotate-90' : 'rotate-0'
	)}
/>
