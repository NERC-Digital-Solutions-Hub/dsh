<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		subtitle?: string;
		open?: boolean;
		class?: string;
		children?: Snippet;
	};

	let { title, subtitle, open = false, class: className, children }: Props = $props();

	let isOpen = $state(false);
</script>

<div class={cn('overflow-hidden rounded-md border bg-background', className)}>
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent/60"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="min-w-0">
			<span class="block text-sm font-semibold text-foreground">{title}</span>
			{#if subtitle}
				<span class="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
			{/if}
		</span>
		<ChevronDownIcon class={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
	</button>

	{#if isOpen}
		<div class="border-t px-4 py-3">
			{@render children?.()}
		</div>
	{/if}
</div>
