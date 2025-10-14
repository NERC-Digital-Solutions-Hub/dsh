<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import { getAppConfigAsync } from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { CatalogueSearchStore } from '$lib/stores/catalogue/catalogue-search-store.svelte';
	import SearchFilter from '$lib/components/common/catalogue/search-filter/search-filter.svelte';
	import ResultsTable from '$lib/components/common/catalogue/results-table/results-table.svelte';
	import SortSelector from '$lib/components/common/catalogue/sort-selector/sort-selector.svelte';
	import ServiceUnavailable from '$lib/components/common/catalogue/service-unavailable/service-unavailable.svelte';
	import {
		Sidebar,
		SidebarContent,
		SidebarInset,
		SidebarProvider,
		SidebarTrigger
	} from '$lib/components/ui/sidebar/index.js';
	import type { AppConfig } from '$lib/types/config';

	let catalogueStore: CatalogueSearchStore | undefined = $state<CatalogueSearchStore | undefined>(
		undefined
	);

	let initialLoadCompleted = $state(false);

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();
		catalogueStore = new CatalogueSearchStore(appConfig.catalogueConfig.catalogueApiUrl);
	});

	$effect(() => {
		if (initialLoadCompleted || !catalogueStore || !catalogueStore.isServiceLoaded) {
			return;
		}

		const init = async () => {
			if (!catalogueStore) {
				return;
			}

			initialLoadCompleted = true;
			await catalogueStore.submit();
		};

		init();
	});

	async function onSearch() {
		console.log('Search clicked');
		if (!catalogueStore) {
			return;
		}

		await catalogueStore.submit();
	}
</script>

<SidebarProvider open={true}>
	<!-- Filter Sidebar -->
	<Sidebar side="left" variant="sidebar" collapsible="offcanvas">
		<SidebarContent>
			<div class="sidebar-offset p-4">
				{#if catalogueStore}
					<SearchFilter catalogueSearchStore={catalogueStore} />
				{/if}
			</div>
		</SidebarContent>
	</Sidebar>

	<!-- Main Content -->
	<SidebarInset>
		<SidebarTrigger class="-ml-1">
			<FilterIcon class="h-4 w-4" />
		</SidebarTrigger>

		<div class="flex-1 p-4">
			<!-- Search Controls -->
			<div class="search-container">
				<div class="search-controls">
					<InputGroup.Root class="search-bar">
						<InputGroup.Input
							placeholder="Search..."
							value={catalogueStore?.getSearchTerm()}
							oninput={(e) => catalogueStore?.setSearchTerm(e.currentTarget.value)}
						/>
						<InputGroup.Addon>
							<SearchIcon />
						</InputGroup.Addon>
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button onclick={onSearch}>Search</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</div>

			<!-- Sort and Results Count -->
			{#if catalogueStore}
				<div class="controls-container">
					<div class="controls-box">
						<div class="text-sm text-muted-foreground">
							{catalogueStore.getResults().totalCount} results
						</div>
						<SortSelector {catalogueStore} />
					</div>
				</div>
			{/if}

			{#if catalogueStore?.isServiceLoaded === false}
				<ServiceUnavailable />
			{:else if catalogueStore?.isServiceLoaded === undefined}
				<div class="no-results">
					<p>Loading service information...</p>
				</div>
			{:else if catalogueStore?.isServiceLoaded === true}
				<!-- Results -->
				<div class="results-section">
					{#if catalogueStore?.isLoading}
						<div class="no-results">
							<p>Loading...</p>
						</div>
					{:else if catalogueStore}
						<ResultsTable {catalogueStore} />
					{/if}
				</div>
			{/if}
		</div>
	</SidebarInset>
</SidebarProvider>

<style>
	.search-container {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.search-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 1200px;
		width: 100%;
	}

	:global(.search-bar) {
		width: 100%;
	}

	.controls-container {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.controls-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		background-color: hsl(var(--card));
	}

	.no-results {
		text-align: center;
		margin-top: 3rem;
		color: #6b7280;
	}

	.sidebar-offset {
		margin-top: var(--header-height, 64px);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.search-controls {
			gap: 0.75rem;
		}

		.controls-box {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
