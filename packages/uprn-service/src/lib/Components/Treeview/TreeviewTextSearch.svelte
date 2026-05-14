<script lang="ts">
	import { Search, X } from '@lucide/svelte';

	import { Input } from '$lib/Components/shadcn/input/index.js';
	import { cn } from '$lib/utils';

	/**
	 * Text search control for BaseTreeview.
	 *
	 * The parent owns placement and available width through `class`; this component owns
	 * the input, search icon, and clear action.
	 */
	type Props = {
		class?: string;
		placeholder?: string;
		searchText?: string;
	};

	let { class: className, placeholder = 'Search...', searchText = $bindable('') }: Props = $props();
</script>

<div class={cn('relative h-8 min-w-0 flex-1', className)}>
	<Search
		class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
	/>
	<Input type="text" {placeholder} class="h-8 pl-8 pr-8 text-sm" bind:value={searchText} />
	{#if searchText}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
			onclick={() => (searchText = '')}
			aria-label="Clear search"
		>
			<X class="size-4" />
		</button>
	{/if}
</div>
