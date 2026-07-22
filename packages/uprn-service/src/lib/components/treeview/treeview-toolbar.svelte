<script lang="ts">
	import ExpandableSearchBar from '$lib/components/expandable-search-bar/expandable-search-bar.svelte';
	import { cn } from '$lib/utils';

	import TreeviewTextSearch from './treeview-text-search.svelte';
	import type { SearchBarConfig } from './base-treeview.svelte';

	import type { Snippet } from 'svelte';

	/**
	 * Toolbar rendered above a BaseTreeview.
	 *
	 * BaseTreeview controls row padding and placement; this component owns only the
	 * search control selection and optional end-slot rendering.
	 */
	type Props = {
		class?: string;
		rowPadding: string;
		searchBar: SearchBarConfig;
		searchText?: string;
		toolbarEnd?: Snippet;
	};

	let {
		class: className,
		rowPadding,
		searchBar,
		searchText = $bindable(''),
		toolbarEnd
	}: Props = $props();
</script>

<div
	class={cn('mb-1 flex h-auto w-full items-end', className)}
	style="padding-inline: {rowPadding};"
>
	{#if searchBar.enabled}
		{#if searchBar.collapsible}
			<ExpandableSearchBar
				bind:searchText
				placeholder={searchBar.placeholder ?? 'Search...'}
				collapsible
			/>
		{:else}
			<TreeviewTextSearch bind:searchText placeholder={searchBar.placeholder ?? 'Search...'} />
		{/if}
	{/if}
	{#if toolbarEnd}
		{@render toolbarEnd()}
	{/if}
</div>
