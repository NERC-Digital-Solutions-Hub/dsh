<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-svelte';
	import {
		SortByCriteria,
		type CatalogueSearchStore
	} from '$lib/stores/catalogue/catalogue-search-store.svelte';

	interface Props {
		catalogueStore: CatalogueSearchStore;
	}

	let { catalogueStore }: Props = $props();

	const sortOptions = [
		{ value: SortByCriteria.Relevance, label: 'Relevance' },
		{ value: SortByCriteria.Title, label: 'Title' },
		{ value: SortByCriteria.PublicationDate, label: 'Publication Date' },
		{ value: SortByCriteria.RevisionDate, label: 'Revision Date' }
	];

	const currentSort = $derived(catalogueStore.getSortBy());
	const currentSortLabel = $derived(
		sortOptions.find((opt) => opt.value === currentSort)?.label || 'Relevance'
	);
	const isAscending = $derived(catalogueStore.getIsAscending());

	async function handleSortChange(sortBy: SortByCriteria) {
		catalogueStore.setSortBy(sortBy);
		await catalogueStore.submit();
	}

	async function handleToggleSortOrder() {
		catalogueStore.toggleSortOrder();
		await catalogueStore.submit();
	}
</script>

<div class="flex gap-2">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" size="sm" class="gap-2">
				<ArrowUpDown class="h-4 w-4" />
				Sort by: {currentSortLabel}
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.Label>Sort by</DropdownMenu.Label>
			<DropdownMenu.Separator />
			{#each sortOptions as option (option.value)}
				<DropdownMenu.Item
					class="flex cursor-pointer items-center justify-between"
					onclick={() => handleSortChange(option.value)}
				>
					<span>{option.label}</span>
					{#if currentSort === option.value}
						<Check class="h-4 w-4" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Button variant="outline" size="sm" class="gap-2" onclick={handleToggleSortOrder}>
		{#if isAscending}
			<ArrowUp class="h-4 w-4" />
			Ascending
		{:else}
			<ArrowDown class="h-4 w-4" />
			Descending
		{/if}
	</Button>
</div>
