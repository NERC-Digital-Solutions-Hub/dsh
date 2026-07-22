<script lang="ts">
	import DataSelectionTreeview from '$lib/components/treeview/data/treeview.svelte';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import type { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import type { TreeviewStore } from '$lib/stores/treeview-store.svelte';

	type Props = {
		mounted: boolean;
		treeviewStore: TreeviewStore;
		nodeConfigProvider: INodeConfigProvider;
		dataSelectionStore: DataSelectionStore;
	};

	const { mounted, treeviewStore, nodeConfigProvider, dataSelectionStore }: Props = $props();
</script>

{#if mounted}
	<DataSelectionTreeview
		{treeviewStore}
		{nodeConfigProvider}
		selectionCount={dataSelectionStore.dataSelections.size}
	/>
{/if}
