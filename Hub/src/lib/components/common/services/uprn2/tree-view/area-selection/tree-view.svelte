<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import type { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';
	import { onDestroy } from 'svelte';
	import Node from './node.svelte';
	import type { AreaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import { TreeLayerNode } from '$lib/components/common/services/uprn2/tree-view/types';
	import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

	/**
	 * Props for the TreeView component.
	 */
	type Props = {
		/** The ESRI WebMap containing layers to display. */
		webMap?: __esri.WebMap | null;

		/** Store for tree view config settings. */
		treeviewConfigStore: TreeviewConfigStore;

		/** Store for area selection management. */
		areaSelectionStore: AreaSelectionStore;
	};

	/** Destructured props with defaults. */
	const { webMap = null, treeviewConfigStore, areaSelectionStore }: Props = $props();

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

		const areaSelectionLayerIds = treeviewStore.getNonHiddenNodes().map((node) => node.id);
		areaSelectionStore.areaSelectionLayerIds = new Set(areaSelectionLayerIds);
	});

	$effect(() => {
		if (!treeviewStore.initialized) {
			return;
		}

		if (!treeviewStore.getVisibleNodes().length) {
			areaSelectionStore.visibleLayer = null;
			areaSelectionStore.resetSelectedAreas();
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

		areaSelectionStore.visibleLayer = node.layer;
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
