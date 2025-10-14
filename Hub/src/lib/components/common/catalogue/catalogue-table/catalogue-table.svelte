<script lang="ts">
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		createColumnHelper,
		getCoreRowModel,
		getSortedRowModel,
		type SortingState
	} from '@tanstack/table-core';
	import type { MetadataCommonDto } from '$lib/types/metadata';
	import type { CatalogueSearchStore } from '$lib/stores/catalogue/catalogue-search-store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpDown } from 'lucide-svelte';

	interface Props {
		catalogueStore: CatalogueSearchStore;
	}

	let { catalogueStore }: Props = $props();

	let sorting = $state<SortingState>([]);
	let loadMoreTrigger: HTMLDivElement | undefined = $state();

	const columnHelper = createColumnHelper<MetadataCommonDto>();

	const columns = [
		columnHelper.accessor('title', {
			header: 'Name',
			cell: (info) => info.getValue()
		}),
		columnHelper.accessor('abstract', {
			header: 'Abstract',
			cell: (info) => info.getValue()
		}),
		columnHelper.accessor((row) => row.publicationDate ?? row.revisionDate ?? '', {
			id: 'publicationDate',
			header: 'Publication Date',
			cell: (info) => {
				const date = info.getValue();
				if (!date) return '';
				return new Date(date).toLocaleDateString();
			}
		})
	];

	const table = $derived(
		createSvelteTable({
			get data() {
				return catalogueStore.getResults().records ?? [];
			},
			columns,
			state: {
				get sorting() {
					return sorting;
				}
			},
			onSortingChange: (updater) => {
				if (updater instanceof Function) {
					sorting = updater(sorting);
				} else {
					sorting = updater;
				}
			},
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel()
		})
	);

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
</script>

<div class="results-container">
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<Button
										variant="ghost"
										onclick={header.column.getToggleSortingHandler()}
										class="flex items-center gap-2"
									>
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
										{#if header.column.getIsSorted() === 'asc'}
											↑
										{:else if header.column.getIsSorted() === 'desc'}
											↓
										{/if}
									</Button>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if table.getRowModel().rows.length}
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
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
</div>

<style>
	.results-container {
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
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
</style>
