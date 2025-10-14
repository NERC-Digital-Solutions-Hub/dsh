<script lang="ts">
	import type { CatalogueSearchStore } from '$lib/stores/catalogue/catalogue-search-store.svelte';
	import ResultsTableItem from './results-table-item/results-table-item.svelte';

	interface Props {
		catalogueStore: CatalogueSearchStore;
	}

	let { catalogueStore }: Props = $props();

	let loadMoreTrigger: HTMLDivElement | undefined = $state();

	// Set up intersection observer for infinite scroll
	$effect(() => {
		if (loadMoreTrigger && catalogueStore) {
			const observer = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					if (entry.isIntersecting && catalogueStore?.hasMore && !catalogueStore?.isLoadingMore) {
						catalogueStore?.loadMore();
					}
				},
				{
					root: null,
					rootMargin: '100px',
					threshold: 0.1
				}
			);

			observer.observe(loadMoreTrigger);

			return () => {
				observer.disconnect();
			};
		}
	});

	function handleViewItem(fileIdentifier: string) {
		console.log('View item:', fileIdentifier);
		// TODO: Implement view details functionality
	}
</script>

<div class="results-container">
	{#if catalogueStore.getResults().records.length > 0}
		<div class="results-list">
			{#each catalogueStore.getResults().records as record, index (`${record.fileIdentifier}-${index}`)}
				<ResultsTableItem {record} onView={() => handleViewItem(record.fileIdentifier)} />
			{/each}
		</div>

		<!-- Infinite scroll trigger -->
		<div bind:this={loadMoreTrigger} class="load-more-trigger">
			{#if catalogueStore?.isLoadingMore}
				<div class="loading-more">
					<p>Loading more results...</p>
				</div>
			{:else if !catalogueStore?.hasMore}
				<div class="no-more-results">
					<p>No more results to load</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-results">
			<p>No results found.</p>
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

	.load-more-trigger {
		min-height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 1rem;
	}

	.loading-more {
		text-align: center;
		padding: 1rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.no-more-results {
		text-align: center;
		padding: 1rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.no-results {
		text-align: center;
		margin-top: 3rem;
		color: hsl(var(--muted-foreground));
		font-size: 1rem;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.results-list {
			gap: 1rem;
		}
	}
</style>
