<script lang="ts">
	import DataSelectionTreeview from '$lib/Components/Treeview/Data/Treeview.svelte';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
	import type { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';

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
