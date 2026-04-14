<script lang="ts">
	import { Input } from '$lib/Components/shadcn/input/index.js';
	import { Search, X } from '@lucide/svelte';
	import type { TreeviewSearch } from './TreeviewSearch.svelte.js';

	type Props = {
		/** The search state manager to bind to. */
		search: TreeviewSearch;
		/** Placeholder text for the input. */
		placeholder?: string;
	};

	const { search, placeholder = 'Search...' }: Props = $props();
</script>

<div class="relative w-full">
	<Search
		class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
	/>
	<Input
		type="text"
		{placeholder}
		class="h-8 pl-8 pr-8 text-sm"
		value={search.query}
		oninput={(e) => search.setQuery(e.currentTarget.value)}
	/>
	{#if search.query}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
			onclick={() => search.setQuery('')}
			aria-label="Clear search"
		>
			<X class="size-4" />
		</button>
	{/if}
</div>
