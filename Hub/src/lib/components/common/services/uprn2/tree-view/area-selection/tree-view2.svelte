<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import type { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';
	import { onDestroy } from 'svelte';
	import Node from './node.svelte';
	import { TreeLayerNode } from '$lib/components/common/services/uprn2/tree-view/types';
	import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
	import { getSelections, type DbUprnAreaSelectionInfo, type DbUprnSelection } from '$lib/db';
	import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
	import type { AreaSelectionStore2 } from '$lib/stores/services/uprn2/area-selection-store2.svelte';

	/**
	 * Props for the TreeView component.
	 */
	type Props = {
		/** The ESRI WebMap containing layers to display. */
		webMap: __esri.WebMap;

		/** Store for tree view config settings. */
		treeviewConfigStore: TreeviewConfigStore;

		/** Store for area selection management. */
		areaSelectionStore: AreaSelectionStore2;
	};

	const { webMap, treeviewConfigStore, areaSelectionStore }: Props = $props();

	const treeviewStore = new TreeviewStore();

	export function clearSelections() {
		treeviewStore.clearSelections();
	}

	// Initialize the tree view when webMap changes
	$effect(() => {
		if (!webMap || treeviewStore.initialized) {
			return;
		}

		treeviewStore.initialize(webMap.layers.toArray(), treeviewConfigStore, null);
	});

	$effect(() => {
		if (!treeviewStore.initialized) {
			return;
		}

		if (!treeviewStore.getVisibleNodes().length) {
			areaSelectionStore.setLayerId(null);
			return;
		}

		const node = treeviewStore
			.getVisibleNodes()
			.find((n) => n instanceof TreeLayerNode && n.layer instanceof FeatureLayer) as
			| TreeLayerNode
			| undefined;

		if (!node || !(node instanceof TreeLayerNode)) {
			console.warn('Visible node is not a FeatureLayer');
			return;
		}

		if (!node.layer || !(node.layer instanceof FeatureLayer)) {
			console.warn('Visible node layer is not a FeatureLayer', node.layer.type);
			return;
		}

		areaSelectionStore.setLayerId(node.id);
	});

	async function restoreSelection() {
		// const selections: DbUprnSelection[] = await getSelections();
		// const lastSelection = selections[selections.length - 1];
		// if (!lastSelection) {
		// 	return;
		// }
		// const areaSelection: DbUprnAreaSelectionInfo = lastSelection.areas;
		// if (!areaSelection) {
		// 	return;
		// }
		// const node: TreeLayerNode | undefined = treeviewStore.getNodeById(areaSelection.layerId) as
		// 	| TreeLayerNode
		// 	| undefined;
		// if (!node || !(node instanceof TreeLayerNode)) {
		// 	console.warn('Area selection layer not found in tree view:', areaSelection.layerId);
		// 	return;
		// }
		// areaSelectionStore.layer = node.layer as FeatureLayer;
		// const layerView: FeatureLayerView = (await layerViewProvider.getLayerView(
		// 	areaSelectionStore.layer
		// )) as FeatureLayerView;
		// if (!layerView) {
		// 	console.warn('Could not get LayerView for area selection layer');
		// 	return;
		// }
		// for (const areaFieldInfo of areaSelection.areaFieldInfos) {
		// 	const handle = layerView.highlight()
		// }
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
