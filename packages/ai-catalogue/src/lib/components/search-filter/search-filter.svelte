<script lang="ts">
	import DateSelector from '$lib/components/date-selector/date-selector.svelte';
	import { Combobox, type ComboboxOption } from '$lib/components/combobox';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import type { ValueCount } from '$lib/types/metadata';
	import { buildArchetypeComboboxOption } from '$lib/utils/archetypes';

	type Props = {
		startDate: string | null;
		endDate: string | null;
		archetypes: ArchetypeDefinition[];
		selectedArchetype: ArchetypeDefinition | null;
		selectedResourceTypes: string[];
		selectedFormats: string[];
		resourceTypes: ValueCount[];
		formats: ValueCount[];
		onStartDateChange: (date: string | null) => void;
		onEndDateChange: (date: string | null) => void;
		onSelectedArchetypeChange: (archetype: ArchetypeDefinition | null) => void;
		onResourceTypesChange: (values: string[]) => void;
		onFormatsChange: (values: string[]) => void;
	};

	let {
		startDate,
		endDate,
		archetypes,
		selectedArchetype,
		selectedResourceTypes,
		selectedFormats,
		resourceTypes,
		formats,
		onStartDateChange,
		onEndDateChange,
		onSelectedArchetypeChange,
		onResourceTypesChange,
		onFormatsChange
	}: Props = $props();

	const selectedArchetypeValues = $derived(selectedArchetype ? [String(selectedArchetype.id)] : []);

	const archetypeOptions = $derived<ComboboxOption[]>(
		archetypes.map((archetype) => buildArchetypeComboboxOption(archetype))
	);

	const resourceTypeOptions = $derived<ComboboxOption[]>(
		resourceTypes.map((resourceType) => ({
			value: resourceType.value,
			label: `${resourceType.value} (${resourceType.count})`
		}))
	);

	const formatOptions = $derived<ComboboxOption[]>(
		formats.map((format) => ({
			value: format.value,
			label: `${format.value} (${format.count})`
		}))
	);

	function handleResourceTypeSelect(value: string) {
		onResourceTypesChange([...selectedResourceTypes, value]);
	}

	function handleResourceTypeDeselect(value: string) {
		onResourceTypesChange(selectedResourceTypes.filter((selectedValue) => selectedValue !== value));
	}

	function handleFormatSelect(value: string) {
		onFormatsChange([...selectedFormats, value]);
	}

	function handleFormatDeselect(value: string) {
		onFormatsChange(selectedFormats.filter((selectedValue) => selectedValue !== value));
	}

	function handleArchetypeSelect(value: string) {
		const nextArchetype = archetypes.find((archetype) => String(archetype.id) === value) ?? null;

		onSelectedArchetypeChange(nextArchetype);
	}
</script>

<div class="search-filter">
	<div class="filter-section">
		<h3 class="filter-title">Role</h3>
		<Combobox
			options={archetypeOptions}
			selectedValues={selectedArchetypeValues}
			onSelect={handleArchetypeSelect}
			maxSelections={1}
			placeholder="Select a role..."
			searchPlaceholder="Search roles..."
			emptyText="No roles found."
			showSelectedBadges={false}
			allowDeselectOnReselect={false}
		/>
	</div>

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
			<DateSelector label="From Date" value={startDate} onDateChange={onStartDateChange} />
			<DateSelector label="To Date" value={endDate} onDateChange={onEndDateChange} />
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
