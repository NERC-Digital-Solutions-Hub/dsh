<script lang="ts">
	import AreaSelectionTreeview from '$lib/components/treeview/area/treeview.svelte';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import type { TreeviewStore } from '$lib/stores/treeview-store.svelte';

	type Props = {
		mounted: boolean;
		treeviewStore: TreeviewStore;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionStore: AreaSelectionStore;
	};

	const { mounted, treeviewStore, nodeConfigProvider, areaSelectionStore }: Props = $props();
</script>

{#if mounted}
	<AreaSelectionTreeview
		{treeviewStore}
		{nodeConfigProvider}
		areaSelectionController={areaSelectionStore}
		selectionCount={areaSelectionStore.areaIds.size}
	/>
{/if}
