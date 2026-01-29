<script lang="ts">
	import * as TreeView from '$lib/components/shadcn/tree-view/index.js';
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/treeview-store.svelte';
	import { onDestroy } from 'svelte';
	import Node from './node.svelte';
	import { LayerDrawState, TreeLayerNode } from '$lib/models/treeview/index.js';
	import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
	import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
	import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { TreeviewType } from '$lib/types/treeview';
	import type { LayerViewProvider } from '$lib/services/layer-view-provider';

	/**
	 * Props for the TreeView component.
	 */
	type Props = {
		/** The ESRI WebMap containing layers to display. */
		webMap: __esri.WebMap;

		/** Store for tree view config settings. */
		treeviewConfigStore: TreeviewConfigStore;

		/** Provider for layer views. */
		layerViewProvider: LayerViewProvider;

		/** Store for area selection management. */
		areaSelectionStore: AreaSelectionStore;
	};

	const { webMap, treeviewConfigStore, layerViewProvider, areaSelectionStore }: Props = $props();

	const treeviewStore = new TreeviewStore();
	let lastLoadedWebMapId: string | null = $state(null);

	function getNodeDrawState(nodeId: string): LayerDrawState {
		console.log(
			'AREA TREEVIEW: Getting draw state for node:',
			nodeId,
			treeviewStore.getNodeDrawState(nodeId)
		);
		return treeviewStore.getNodeDrawState(nodeId);
	}

	export function clearSelections() {
		treeviewStore.clearSelections();
	}

	// Initialize the tree view when webMap changes
	$effect(() => {
		if (!webMap || webMap.portalItem?.id === lastLoadedWebMapId) {
			return;
		}

		treeviewStore.clearSelections();
		treeviewStore.initialize(
			TreeviewType.Area,
			webMap.layers.toArray(),
			treeviewConfigStore,
			layerViewProvider
		);
		lastLoadedWebMapId = webMap.portalItem?.id || null;
	});

	$effect(() => {
		if (!lastLoadedWebMapId) {
			return;
		}

		if (!treeviewStore.getVisibleNodes().length && areaSelectionStore.layerId) {
			treeviewStore.setVisibilityState(areaSelectionStore.layerId, true);
		}
	});

	$effect(() => {
		if (!lastLoadedWebMapId) {
			return;
		}

		if (!treeviewStore.getVisibleNodes().length) {
			//areaSelectionStore.setLayerId(null);
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
				{getNodeDrawState}
				depth={0}
				useLayerTypeIcon={true}
			/>
		{/each}
	</TreeView.Root>
{/if}
