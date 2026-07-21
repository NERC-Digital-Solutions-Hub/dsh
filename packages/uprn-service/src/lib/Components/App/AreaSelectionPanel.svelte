<script lang="ts">
	import AreaSelectionTreeview from '$lib/Components/Treeview/Area/Treeview.svelte';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
	import type { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';

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
