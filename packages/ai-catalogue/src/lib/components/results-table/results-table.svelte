<script lang="ts">
	import { get } from 'svelte/store';
	import { untrack } from 'svelte';
	import { createWindowVirtualizer } from '@tanstack/svelte-virtual';
	import ResultsTableItem from './results-table-item/results-table-item.svelte';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import type { CatalogueResultCardRecord } from '$lib/utils/catalogue-ui';

	interface Props {
		records: CatalogueResultCardRecord[];
		selectedArchetype?: ArchetypeDefinition | null;
		searchTerm?: string | null;
		hasMore?: boolean;
		isLoadingMore?: boolean;
		onLoadMore?: () => void | Promise<void>;
	}

	let {
		records,
		selectedArchetype = null,
		searchTerm = null,
		hasMore = false,
		isLoadingMore = false,
		onLoadMore
	}: Props = $props();

	const trimmedSearchTerm = $derived(searchTerm?.trim() ?? null);

	const ITEM_GAP = 24; // 1.5rem

	const virtualizer = createWindowVirtualizer({
		count: records.length,
		estimateSize: () => 380 + ITEM_GAP,
		overscan: 3
	});

	// Keep virtualizer count in sync with records without subscribing to the store
	// (which would cause an infinite loop since setOptions triggers a store update)
	$effect(() => {
		const count = records.length;
		untrack(() => {
			$virtualizer.setOptions({ count });
		});
	});

	// Trigger load-more when the last virtual item becomes visible
	$effect(() => {
		const items = $virtualizer.getVirtualItems();
		const lastItem = items[items.length - 1];
		if (
			lastItem &&
			lastItem.index >= records.length - 1 &&
			hasMore &&
			!isLoadingMore &&
			onLoadMore
		) {
			void onLoadMore();
		}
	});

	// Svelte action: registers the element with the virtualizer for dynamic size measurement
	function measureElement(el: HTMLElement) {
		get(virtualizer).measureElement(el);
		return {};
	}
</script>

<div class="results-container">
	{#if records.length > 0}
		<div style="position: relative; height: {$virtualizer.getTotalSize()}px;">
			{#each $virtualizer.getVirtualItems() as item (item.key)}
				<div
					use:measureElement
					data-index={item.index}
					style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({item.start}px); padding-bottom: {ITEM_GAP}px;"
				>
					<ResultsTableItem record={records[item.index]} {selectedArchetype} />
				</div>
			{/each}
		</div>
		<div class="load-more-trigger">
			{#if isLoadingMore}
				<p class="load-more-message">Loading more results...</p>
			{:else if !hasMore}
				<p class="load-more-message load-more-message--muted">No more results to load.</p>
			{/if}
		</div>
	{:else}
		<div class="no-results">
			<p>
				{trimmedSearchTerm ? `No results found for "${trimmedSearchTerm}".` : 'No results found.'}
			</p>
		</div>
	{/if}
</div>

<style>
	.results-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.no-results {
		text-align: center;
		margin-top: 3rem;
		color: hsl(var(--muted-foreground));
		font-size: 1rem;
	}

	.load-more-trigger {
		min-height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.load-more-message {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.load-more-message--muted {
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.results-list {
			gap: 1rem;
		}
	}
</style>
