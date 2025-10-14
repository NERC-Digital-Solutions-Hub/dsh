<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './node.svelte';
	import type { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';

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

	async function loadAreaSelectionLayers(layers: __esri.Layer[]): Promise<void> {
		for (const layer of layers) {
			try {
				const config = treeviewConfigStore.getItemConfig(layer.id);
				console.log(`[area-selection-tree-view] Checking layer: ${layer.title}, config:`, config);
				if (config && config.isHidden) {
					continue;
				}

				await layer.load();
				console.log(`[area-selection-tree-view] Loaded layer: ${layer.title}`);
				if (layer.type === 'group') {
					const groupLayer = layer as __esri.GroupLayer;
					await loadAreaSelectionLayers(groupLayer.layers.toArray());
				}
			} catch (error) {
				console.error(`[area-selection-tree-view] Failed to load layer: ${layer.title}`, error);
			}
		}
	}
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
