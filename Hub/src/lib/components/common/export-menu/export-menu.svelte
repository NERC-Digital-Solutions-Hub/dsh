<script lang="ts">
	import {
		selectedAreasStore,
		type HighlightAreaInfo
	} from '$lib/stores/selected-areas-store.svelte';
	import { selectedDataStore } from '$lib/stores/selected-data-store.svelte';
	import { areaSelectionTreeviewStore } from '$lib/stores/area-selection-tree-view-store.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	type AreaInfo = {
		name: string;
		HighlightAreaInfo: HighlightAreaInfo;
	};

	let areaInfos: AreaInfo[] = $state<AreaInfo[]>([]);

	$effect(() => {
		if (!selectedAreasStore.layerHighlightState.areaInfos.length) {
			areaInfos = [];
			return;
		}

		const getAreaInfos = async () => {
			const arenaNames = await selectedAreasStore.getAreaNamesById(
				selectedAreasStore.layerHighlightState.areaInfos.map((area) => area.id)
			);

			const newAreaInfos: AreaInfo[] = [];
			for (let i = 0; i < arenaNames.length; i++) {
				newAreaInfos.push({
					name: arenaNames[i] || 'Unknown Area',
					HighlightAreaInfo: selectedAreasStore.layerHighlightState.areaInfos[i]
				});
			}
			areaInfos = newAreaInfos;
		};

		getAreaInfos();
	});

	function removeArea(areaName: string) {
		// Find the area ID by name and remove it
		const areaIndex = areaInfos.findIndex((area) => area.name === areaName);
		if (areaIndex !== -1) {
			selectedAreasStore.removeSelectedArea(areaInfos[areaIndex]?.HighlightAreaInfo.id);
		}
	}
</script>

<h2>Export Options</h2>

<div class="section">
	<h3>{areaSelectionTreeviewStore.visibleNode?.layer.title}</h3>
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
	{#if selectedDataStore.SelectedData.size > 0}
		<ul class="selected-list">
			{#each [...selectedDataStore.SelectedData] as data}
				<li>
					{data.name}
					{data.fields ? `(${data.fields.join(', ')})` : '(all fields)'}
				</li>
			{/each}
		</ul>
		<p class="count">{selectedDataStore.SelectedData.size} data layer(s) selected</p>
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

	.area-item {
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

	.area-name {
		flex: 1;
		min-width: 0;
	}

	:global(.area-remove-btn) {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.area-remove-btn:hover) {
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
