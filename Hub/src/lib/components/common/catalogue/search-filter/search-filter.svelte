<script lang="ts">
	import DateSelector from '$lib/components/common/date-selector/date-selector.svelte';
	import { Combobox, type ComboboxOption } from '$lib/components/common/combobox';
	import type { CatalogueSearchStore } from '$lib/stores/catalogue-search-store.svelte';

	type Props = {
		catalogueSearchStore: CatalogueSearchStore;
	};

	let { catalogueSearchStore }: Props = $props();

	// Get initial values from store
	const dateRange = catalogueSearchStore.getDateRange();
	let startDate = $state<string | null>(dateRange.start ?? null);
	let endDate = $state<string | null>(dateRange.end ?? null);
	let selectedResourceTypes = $state<string[]>(catalogueSearchStore.getSelectedResourceTypes());
	let selectedFormats = $state<string[]>(catalogueSearchStore.getSelectedFormats());

	// Convert resource types to combobox options
	const resourceTypeOptions = $derived<ComboboxOption[]>(
		catalogueSearchStore.getResourceTypes().map((rt) => ({
			value: rt.value,
			label: `${rt.value} (${rt.count})`
		}))
	);

	// Convert formats to combobox options
	const formatOptions = $derived<ComboboxOption[]>(
		catalogueSearchStore.getFormats().map((format) => ({
			value: format.value,
			label: `${format.value} (${format.count})`
		}))
	);

	function handleStartDateChange(date: string | null) {
		startDate = date;
		catalogueSearchStore.setDateRange(startDate, endDate);
	}

	function handleEndDateChange(date: string | null) {
		endDate = date;
		catalogueSearchStore.setDateRange(startDate, endDate);
	}

	function handleResourceTypeSelect(value: string) {
		selectedResourceTypes = [...selectedResourceTypes, value];
		catalogueSearchStore.setSelectedResourceTypes(selectedResourceTypes);
	}

	function handleResourceTypeDeselect(value: string) {
		selectedResourceTypes = selectedResourceTypes.filter((v) => v !== value);
		catalogueSearchStore.setSelectedResourceTypes(selectedResourceTypes);
	}

	function handleFormatSelect(value: string) {
		selectedFormats = [...selectedFormats, value];
		catalogueSearchStore.setSelectedFormats(selectedFormats);
	}

	function handleFormatDeselect(value: string) {
		selectedFormats = selectedFormats.filter((v) => v !== value);
		catalogueSearchStore.setSelectedFormats(selectedFormats);
	}
</script>

<div class="search-filter">
	<div class="filter-section">
		<h3 class="filter-title">Resource Types</h3>
		<Combobox
			options={resourceTypeOptions}
			selectedValues={selectedResourceTypes}
			onSelect={handleResourceTypeSelect}
			onDeselect={handleResourceTypeDeselect}
			placeholder="Select resource types..."
			searchPlaceholder="Search resource types..."
		/>
	</div>

	<div class="filter-section">
		<h3 class="filter-title">Publication Date</h3>
		<div class="date-filters">
			<DateSelector label="From Date" value={startDate} onDateChange={handleStartDateChange} />

			<DateSelector label="To Date" value={endDate} onDateChange={handleEndDateChange} />
		</div>
	</div>

	<div class="filter-section">
		<h3 class="filter-title">Formats</h3>
		<Combobox
			options={formatOptions}
			selectedValues={selectedFormats}
			onSelect={handleFormatSelect}
			onDeselect={handleFormatDeselect}
			placeholder="Select formats..."
			searchPlaceholder="Search formats..."
		/>
	</div>
</div>

<style>
	.search-filter {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.filter-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.date-filters {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
