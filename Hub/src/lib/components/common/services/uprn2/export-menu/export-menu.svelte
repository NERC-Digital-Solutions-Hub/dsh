<script lang="ts">
	import {
		areaSelectionStore,
		type HighlightAreaInfo
	} from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import { dataSelectionStore } from '$lib/stores/services/uprn2/data-selection-store.svelte';
	import { WebMapStore } from '$lib/stores/services/uprn2/web-map-store.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import FilterButton from '../tree-view/data-selection/filter-button.svelte';
	import FilterFieldMenuStore from '$lib/stores/services/uprn2/field-filter-menu-store.svelte';
	import type { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';

	export type Props = {
		webMapStore: WebMapStore;
		areaSelectionTreeviewStore: TreeviewStore;
		fieldFilterMenuStore: FilterFieldMenuStore;
	};
	const { webMapStore, areaSelectionTreeviewStore, fieldFilterMenuStore }: Props = $props();

	type AreaInfo = {
		name: string;
		HighlightAreaInfo: HighlightAreaInfo;
	};

	let areaInfos: AreaInfo[] = $state<AreaInfo[]>([]);

	$effect(() => {
		if (!areaSelectionStore.layerHighlightState.areaInfos.length) {
			areaInfos = [];
			return;
		}

		const getAreaInfos = async () => {
			const arenaNames = await areaSelectionStore.getAreaNamesById(
				areaSelectionStore.layerHighlightState.areaInfos.map((area) => area.id)
			);

			const newAreaInfos: AreaInfo[] = [];
			for (let i = 0; i < arenaNames.length; i++) {
				newAreaInfos.push({
					name: arenaNames[i] || 'Unknown Area',
					HighlightAreaInfo: areaSelectionStore.layerHighlightState.areaInfos[i]
				});
			}
			areaInfos = newAreaInfos;
		};

		getAreaInfos();
	});

	function removeArea(areaName: string) {
		const areaIndex = areaInfos.findIndex((area) => area.name === areaName);
		if (areaIndex !== -1) {
			areaSelectionStore.removeSelectedArea(areaInfos[areaIndex]?.HighlightAreaInfo.id);
		}
	}

	function removeDataSelection(layerId: string) {
		// Remove the data selection from the store
		console.log('[export-menu] Removing data selection for layerId:', layerId);
		dataSelectionStore.DataSelections.delete(layerId);
		console.log(
			'[export-menu] Current SelectedData:',
			$state.snapshot(dataSelectionStore.DataSelections)
		);
	}

	function handleFilterClicked(layerId: string) {
		if (fieldFilterMenuStore.ActiveLayer?.id === layerId) {
			fieldFilterMenuStore.ActiveLayer = null;
			return;
		}

		const layer: __esri.Layer | undefined = webMapStore.dataLookup.get(layerId);
		if (!layer) {
			console.warn(`[export-menu] Layer with ID ${layerId} not found in web map store.`);
			return;
		}

		fieldFilterMenuStore.ActiveLayer = layer;
	}

	function hasFiltersApplied(layerId: string): boolean {
		const dataSelection = dataSelectionStore.DataSelections.get(layerId);
		if (
			!dataSelection ||
			!dataSelection.fields ||
			dataSelection.fields.size === 0 ||
			dataSelection.fields.size ===
				(webMapStore.dataLookup.get(layerId) as __esri.FeatureLayer)?.fields?.length
		) {
			return false;
		}

		return true;
	}
</script>

<h2>Export Options</h2>

<div class="section">
	<h3>
		{areaSelectionTreeviewStore.initialized
			? areaSelectionTreeviewStore.getVisibleNodes()[0]?.name
			: 'Loading...'}
	</h3>
	<h4>Selected Areas</h4>
	{#if areaInfos.length > 0}
		<ul class="selected-list">
			{#each areaInfos as area}
				<li class="area-item">
					<span class="area-name">{area.name}</span>
					<Button
						variant="ghost"
						size="sm"
						class="area-remove-btn"
						onclick={() => removeArea(area.name)}
					>
						×
					</Button>
				</li>
			{/each}
		</ul>
		<p class="count">
			{areaInfos.length} area(s) selected
		</p>
	{:else}
		<p class="no-selection">No areas selected</p>
	{/if}
</div>

<div class="section">
	<h4>Selected Data</h4>
	{#if dataSelectionStore.DataSelections.size > 0}
		<ul class="selected-list">
			{#each [...dataSelectionStore.DataSelections.values()] as data}
				<li class="data-item">
					<span class="data-name">
						{data.name}
					</span>
					<div class="data-actions">
						{#if data.fields}
							<FilterButton
								layerId={data.layerId}
								onFilterClicked={handleFilterClicked}
								{hasFiltersApplied}
							/>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							class="data-remove-btn"
							onclick={() => removeDataSelection(data.layerId)}
						>
							×
						</Button>
					</div>
				</li>
			{/each}
		</ul>
		<p class="count">{dataSelectionStore.DataSelections.size} data layer(s) selected</p>
	{:else}
		<p class="no-selection">No data selected</p>
	{/if}
</div>

<style>
	h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #1f2937;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.375rem;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.selected-list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.5rem 0;
	}

	.selected-list li {
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.25rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.area-item,
	.data-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.area-name,
	.data-name {
		flex: 1;
		min-width: 0;
	}

	.data-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem; /* 8px gap between filter and remove buttons */
	}

	:global(.area-remove-btn),
	:global(.data-remove-btn) {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.area-remove-btn:hover),
	:global(.data-remove-btn:hover) {
		color: #ef4444;
	}

	.count {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.no-selection {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}
</style>
