<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './node.svelte';
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/treeview-store2.svelte';

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewStore: TreeviewStore;
		treeviewConfigStore: TreeviewConfigStore;
	};

	const { webMap = null, treeviewStore, treeviewConfigStore }: Props = $props();

	$effect(() => {
		if (!webMap || treeviewStore.initialized) {
			return;
		}

		treeviewStore.initialize(webMap.layers.toArray(), treeviewConfigStore);
	});
</script>

{#if treeviewStore.initialized}
	<TreeView.Root>
		{#each treeviewStore.getNodes() as node (node.id)}
			<Node
				{treeviewConfigStore}
				{node}
				onNodeClick={() => {}}
				onNodeVisibilityChange={(node, visible) =>
					treeviewStore.setVisibilityState(node.id, visible)}
				getNodeVisibility={(nodeId) => treeviewStore.getVisibilityState(nodeId)}
				depth={0}
				useLayerTypeIcon={true}
			/>
		{/each}
	</TreeView.Root>
{/if}
