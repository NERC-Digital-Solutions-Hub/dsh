<script lang="ts">
	import { asset } from '$app/paths';
	import SearchFilter from '$lib/components/search-filter/search-filter.svelte';
	import SelectedArchetypeToast from '$lib/components/app/selected-archetype-toast.svelte';
	import ResultsTable from '$lib/components/results-table/results-table.svelte';
	import ServiceUnavailable from '$lib/components/service-unavailable/service-unavailable.svelte';
	import SortSelector from '$lib/components/sort-selector/sort-selector.svelte';
	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import * as InputGroup from '$lib/components/shadcn/input-group/index.js';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/shadcn/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import {
		useFetchArchetypes,
		useFetchFormats,
		useFetchResourceTypes,
		useQueryMetadata
	} from '$lib';
	import {
		Sidebar,
		SidebarContent,
		SidebarInset,
		SidebarProvider,
		SidebarTrigger
	} from '$lib/components/shadcn/sidebar/index.js';
	import type { ApiRequestError } from '$lib/hooks/_api-request';
	import type {
		AiCatalogueApiEndpoints,
		ArchetypeDefinition,
		QueryRequest,
		QuerySortBy
	} from '$lib/types/api.types';
	import type { CatalogueConfig } from '$lib/types/config';
	import type { ValueCount } from '$lib/types/metadata';
	import { adaptQueryRecords, SortByCriteria } from '$lib/utils/catalogue-ui';
	import { getArchetypeIcon } from '$lib/utils/archetypes';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ArchetypeDialog from '$lib/components/archetype-dialog/archetype-dialog.svelte';

	const PAGE_SIZE = 20;

	let searchTerm = $state(null);
	let submittedSearchTerm = $state(null);
	let timeStartDate = $state<string | null>(null);
	let timeEndDate = $state<string | null>(null);
	let startDate = $state<string | null>(null);
	let endDate = $state<string | null>(null);
	let selectedResourceTypes = $state<string[]>([]);
	let selectedFormats = $state<string[]>([]);
	let sortBy = $state(SortByCriteria.Relevance);
	let isAscending = $state(true);
	let configError = $state<unknown>(null);
	let initialLoadError = $state<unknown>(null);
	let isConfigLoading = $state(true);
	let isLoadingMore = $state(false);
	let hasMore = $state(true);
	let hasInitialQueryCompleted = $state(false);
	let fetchArchetypes = $state<ReturnType<typeof useFetchArchetypes> | null>(null);
	let metadataQuery = $state<ReturnType<typeof useQueryMetadata> | null>(null);
	let resourceTypesQuery = $state<ReturnType<typeof useFetchResourceTypes> | null>(null);
	let formatsQuery = $state<ReturnType<typeof useFetchFormats> | null>(null);
	let currentPageIndex = $state(0);
	let activeRequestBase = $state<Omit<QueryRequest, 'pagination'> | null>(null);

	let selectedArchetype = $state<ArchetypeDefinition | null>(null);
	let previousSelectedArchetypeId = $state<number | null>(null);
	let openArchetypeDialog = $state(true);

	const apiRecords = $derived(metadataQuery?.content?.payload ?? []);
	const records = $derived(adaptQueryRecords(apiRecords));
	const resourceTypes = $derived(toValueCounts(resourceTypesQuery?.content?.results));
	const formats = $derived(toValueCounts(formatsQuery?.content?.results));
	const isServiceUnavailable = $derived(Boolean(configError) || Boolean(initialLoadError));
	const canSearch = $derived(
		Boolean(metadataQuery) && !isConfigLoading && !isServiceUnavailable && !metadataQuery?.isLoading
	);
	const queryErrorMessage = $derived(getApiErrorMessage(metadataQuery?.error));
	const archetypes: ArchetypeDefinition[] = $derived(fetchArchetypes?.content?.results ?? []);

	onMount(() => {
		void initialise();
	});

	function buildEndpoints(baseUrl: string): AiCatalogueApiEndpoints {
		const normalisedBaseUrl = baseUrl.replace(/\/+$/, '');

		return {
			baseUrl: normalisedBaseUrl,
			getArchetypesRoute: normalisedBaseUrl.replace(/\/v\d+(?=\/|$)/, '/v1') + '/archetypes',
			queryMetadataRoute: `${normalisedBaseUrl}/metadata/query`,
			getResourceTypesRoute: `${normalisedBaseUrl}/metadata/resource-types`,
			getFormatsRoute: `${normalisedBaseUrl}/metadata/formats`
		};
	}

	$effect(() => {
		const availableResourceTypes = new Set(resourceTypes.map((resourceType) => resourceType.value));
		const nextSelectedResourceTypes = selectedResourceTypes.filter((resourceType) =>
			availableResourceTypes.has(resourceType)
		);

		if (nextSelectedResourceTypes.length !== selectedResourceTypes.length) {
			selectedResourceTypes = nextSelectedResourceTypes;
		}
	});

	$effect(() => {
		const availableFormats = new Set(formats.map((format) => format.value));
		const nextSelectedFormats = selectedFormats.filter((format) => availableFormats.has(format));

		if (nextSelectedFormats.length !== selectedFormats.length) {
			selectedFormats = nextSelectedFormats;
		}
	});

	$effect(() => {
		if (archetypes.length === 0) {
			selectedArchetype = null;
			previousSelectedArchetypeId = null;
			return;
		}

		if (!selectedArchetype) {
			selectedArchetype = archetypes[0];
		}
	});

	$effect(() => {
		if (!selectedArchetype) {
			previousSelectedArchetypeId = null;
			return;
		}

		if (previousSelectedArchetypeId === null) {
			previousSelectedArchetypeId = selectedArchetype.id;
			return;
		}

		if (previousSelectedArchetypeId === selectedArchetype.id) {
			return;
		}

		previousSelectedArchetypeId = selectedArchetype.id;
		toast(SelectedArchetypeToast, {
			componentProps: {
				name: selectedArchetype.name
			},
			icon: getArchetypeIcon(selectedArchetype.id)
		});
	});

	async function initialise() {
		isConfigLoading = true;
		configError = null;
		initialLoadError = null;

		try {
			const path = asset('/config/catalogues/ai/api.json');
			const response = await fetch(path);

			if (!response.ok) {
				throw new Error(`Unable to load catalogue configuration: ${response.statusText}`);
			}

			const apiConfig = (await response.json()) as CatalogueConfig;
			const serviceEndpoints = buildEndpoints(apiConfig.catalogueApiUrl);
			metadataQuery = useQueryMetadata(serviceEndpoints.queryMetadataRoute);
			resourceTypesQuery = useFetchResourceTypes(serviceEndpoints.getResourceTypesRoute);
			formatsQuery = useFetchFormats(serviceEndpoints.getFormatsRoute);
			fetchArchetypes = useFetchArchetypes(serviceEndpoints.getArchetypesRoute);

			await Promise.allSettled([
				resourceTypesQuery.fetch(),
				formatsQuery.fetch(),
				fetchArchetypes.fetch()
			]);
			await executeSearch();

			if (metadataQuery.error && records.length === 0) {
				initialLoadError = metadataQuery.error;
			}
		} catch (error) {
			configError = error;
		} finally {
			isConfigLoading = false;
		}
	}

	async function executeSearch(nextSearchTerm = submittedSearchTerm) {
		if (!metadataQuery) {
			return;
		}

		const requestBase = buildRequestBase(nextSearchTerm);
		activeRequestBase = requestBase;
		currentPageIndex = 0;
		hasMore = true;
		isLoadingMore = false;

		await metadataQuery.fetch(
			{
				...requestBase,
				pagination: {
					index: currentPageIndex,
					size: PAGE_SIZE
				}
			},
			{ append: false }
		);

		hasMore = (metadataQuery.content?.payload?.length ?? 0) >= PAGE_SIZE;
		hasInitialQueryCompleted = true;
	}

	async function loadMoreResults() {
		if (
			!metadataQuery ||
			!activeRequestBase ||
			metadataQuery.isLoading ||
			isLoadingMore ||
			!hasMore
		) {
			return;
		}

		const nextPageIndex = currentPageIndex + 1;
		isLoadingMore = true;

		try {
			await metadataQuery.fetch(
				{
					...activeRequestBase,
					pagination: {
						index: nextPageIndex,
						size: PAGE_SIZE
					}
				},
				{ append: true }
			);

			const existingRecords = metadataQuery.content?.payload ?? [];
			const previousRecordCount =
				currentPageIndex === 0 ? PAGE_SIZE : currentPageIndex * PAGE_SIZE + PAGE_SIZE;
			const returnedRecordCount = existingRecords.length - previousRecordCount;

			currentPageIndex = nextPageIndex;
			hasMore = returnedRecordCount >= PAGE_SIZE;
		} catch {
			hasMore = false;
		} finally {
			isLoadingMore = false;
		}
	}

	async function onSearch(event: SubmitEvent) {
		event.preventDefault();

		if (!metadataQuery || isServiceUnavailable) {
			return;
		}

		submittedSearchTerm = searchTerm;
		await executeSearch(searchTerm);
	}

	async function rerunActiveSearch() {
		if (!hasInitialQueryCompleted || isServiceUnavailable) {
			return;
		}

		await executeSearch(submittedSearchTerm);
	}

	function normaliseSearchTerm(term?: string | null): string | null {
		return term ? term.trim() || null : null;
	}

	function handleSortChange(nextSortBy: SortByCriteria) {
		sortBy = nextSortBy;
		void rerunActiveSearch();
	}

	function handleToggleSortOrder() {
		isAscending = !isAscending;
		void rerunActiveSearch();
	}

	function buildRequestBase(nextSearchTerm: string | null): Omit<QueryRequest, 'pagination'> {
		const request: Omit<QueryRequest, 'pagination'> = {
			searchTerm: normaliseSearchTerm(nextSearchTerm),
			resourceTypes: selectedResourceTypes.length > 0 ? selectedResourceTypes : null,
			formats: selectedFormats.length > 0 ? selectedFormats : null,
			sortBy: Number(sortBy) as QuerySortBy,
			isDescending: !isAscending
		};

		if (startDate || endDate) {
			request.dateRange = {
				start: startDate,
				end: endDate
			};
		}

		if (timeStartDate || timeEndDate) {
			request.dataTimeSpan = {
				start: timeStartDate,
				end: timeEndDate
			};
		}

		return request;
	}

	function toValueCounts(
		values?: Array<{ value?: string | null; count?: number }> | null
	): ValueCount[] {
		return (values ?? [])
			.filter((entry): entry is { value?: string | null; count?: number } => Boolean(entry?.value))
			.map((entry) => ({
				value: entry.value?.trim() ?? '',
				count: entry.count ?? 0
			}))
			.filter((entry) => entry.value.length > 0);
	}

	function getApiErrorMessage(error: unknown) {
		if (!error) {
			return undefined;
		}

		const apiError = error as Partial<ApiRequestError>;
		const validationProblem = apiError.validationProblem;

		if (validationProblem?.errors) {
			return Object.values(validationProblem.errors).flat().filter(Boolean).join(' ');
		}

		return (
			validationProblem?.detail ||
			validationProblem?.title ||
			apiError.bodyText ||
			apiError.message ||
			'Something went wrong while searching the catalogue.'
		);
	}
</script>

<Toaster position="top-center" />

{#if archetypes.length > 0}
	<ArchetypeDialog
		{archetypes}
		open={openArchetypeDialog}
		onSelectArchetype={(archetype) => (selectedArchetype = archetype)}
	/>
{/if}

<SidebarProvider open={true}>
	<!-- Filter Sidebar -->
	<Sidebar side="left" variant="sidebar" collapsible="offcanvas">
		<SidebarContent>
			<div class="sidebar-offset p-4">
				<SearchFilter
					{timeStartDate}
					{timeEndDate}
					{startDate}
					{endDate}
					{archetypes}
					{selectedArchetype}
					{selectedResourceTypes}
					{selectedFormats}
					{resourceTypes}
					{formats}
					onTimeStartDateChange={(date) => (timeStartDate = date)}
					onTimeEndDateChange={(date) => (timeEndDate = date)}
					onStartDateChange={(date) => (startDate = date)}
					onEndDateChange={(date) => (endDate = date)}
					onSelectedArchetypeChange={(archetype) => (selectedArchetype = archetype)}
					onResourceTypesChange={(values) => (selectedResourceTypes = values)}
					onFormatsChange={(values) => (selectedFormats = values)}
				/>
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
			<form class="search-container" onsubmit={onSearch}>
				<div class="search-controls">
					<InputGroup.Root class="search-bar">
						<InputGroup.Input
							placeholder="Search catalogue metadata..."
							bind:value={searchTerm}
							disabled={isConfigLoading || isServiceUnavailable}
						/>
						<InputGroup.Addon>
							<SearchIcon />
						</InputGroup.Addon>
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button type="submit" disabled={!canSearch}>
								{metadataQuery?.isLoading ? 'Searching...' : 'Search'}
							</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>

					{#if queryErrorMessage}
						<Alert.Root variant="destructive">
							<AlertCircleIcon />
							<Alert.Title>Search failed</Alert.Title>
							<Alert.Description>{queryErrorMessage}</Alert.Description>
						</Alert.Root>
					{/if}
				</div>
			</form>

			{#if isServiceUnavailable}
				<ServiceUnavailable />
			{:else}
				<div class="controls-container">
					<div class="controls-box">
						<div class="text-sm text-muted-foreground">
							{records.length} results
						</div>
						<SortSelector
							{sortBy}
							{isAscending}
							onSortChange={handleSortChange}
							onToggleSortOrder={handleToggleSortOrder}
						/>
					</div>
				</div>

				<div class="results-section">
					{#if !hasInitialQueryCompleted}
						<div class="no-results">
							<p>Loading catalogue results...</p>
						</div>
					{:else}
						{#if metadataQuery?.isLoading}
							<div class="results-status">Updating results...</div>
						{/if}
						<ResultsTable
							{records}
							{selectedArchetype}
							searchTerm={submittedSearchTerm}
							{hasMore}
							{isLoadingMore}
							onLoadMore={loadMoreResults}
						/>
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

	.results-status {
		max-width: 1200px;
		margin: 0 auto 1rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
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
