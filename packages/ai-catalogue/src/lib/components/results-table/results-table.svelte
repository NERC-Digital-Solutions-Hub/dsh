<script lang="ts">
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
	let loadMoreTrigger = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!loadMoreTrigger || !onLoadMore) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && hasMore && !isLoadingMore) {
					void onLoadMore();
				}
			},
			{
				root: null,
				rootMargin: '200px',
				threshold: 0.1
			}
		);

		observer.observe(loadMoreTrigger);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div class="results-container">
	{#if records.length > 0}
		<div class="results-list">
			{#each records as record, index (`${record.fileIdentifier ?? record.title ?? 'result'}-${index}`)}
				<ResultsTableItem {record} {selectedArchetype} />
			{/each}
		</div>
		<div bind:this={loadMoreTrigger} class="load-more-trigger">
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

	.results-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
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
