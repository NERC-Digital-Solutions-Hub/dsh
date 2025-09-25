<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './node.svelte';
	import type { TreeviewConfig } from '$lib/utils/app-config-provider.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import { areaSelectionTreeviewStore } from '$lib/stores/area-selection-tree-view-store.svelte';

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewConfig?: TreeviewConfig[] | null;
	};
	const { webMap = null, treeviewConfig = null }: Props = $props();

	$effect(() => {
		if (!webMap) {
			return;
		}

		const initializeAsync = async () => {
			await areaSelectionTreeviewStore.initializeFromWebMap(webMap, treeviewConfig);
		};

		initializeAsync();
	});
</script>

<Toaster />

<TreeView.Root>
	{#each areaSelectionTreeviewStore.layerTree as node (node.id)}
		<Node
			{node}
			onNodeClick={() => {}}
			onNodeVisibilityChange={(node, visible) =>
				areaSelectionTreeviewStore.handleNodeVisibleToggle(node, visible)}
			getNodeVisibility={(nodeId) => areaSelectionTreeviewStore.getNodeVisibility(nodeId)}
			depth={0}
			useLayerTypeIcon={true}
		/>
	{/each}
</TreeView.Root>

<style>
</style>
