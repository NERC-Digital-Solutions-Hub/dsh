<!--
	TreeView Component
	
	A comprehensive tree view component for displaying and managing map layers in a hierarchical structure.
	This component provides functionality for:
	- Layer visibility management with group constraints
	- Download state tracking for data selection
	- Filter management for layer fields
	- Support for various ESRI layer types (FeatureLayer, GroupLayer, MapImageLayer, WMSLayer)
	
	Props:
	- webMap: The ESRI WebMap containing layers to display
	- treeviewConfig: Configuration object defining layer visibility groups and downloadability
	- fieldFilterMenuStore: Store for managing field filter state
	
	Features:
	- Automatic parent-child visibility relationships
	- Visibility groups that enforce single active layer per group
	- Integration with data selection store for downloads
	- Filter state management per layer
	- Hierarchical display with proper indentation
-->

<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './node.svelte';
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store.js';
	import type { TreeNode } from './types.js';
	import { dataSelectionStore, type DataSelection } from '$lib/stores/data-selection-store.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import { TreeviewStore } from '$lib/stores/treeview-store.svelte';

	// =====================================
	// TYPES & PROPS
	// =====================================

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewConfigStore: TreeviewConfigStore;
		fieldFilterMenuStore: FieldFilterMenuStore;
	};

	const { webMap = null, treeviewConfigStore, fieldFilterMenuStore }: Props = $props();

	const treeviewStore = new TreeviewStore();

	// =====================================
	// REACTIVE EFFECTS
	// =====================================

	/**
	 * Main effect that watches for webMap changes and rebuilds the layer tree.
	 * Initializes layer visibility and builds the tree structure.
	 */
	$effect(() => {
		if (!webMap) {
			return;
		}

		const initializeWebMap = async () => {
			await webMap.when();
			treeviewStore.initialize(webMap.layers.toArray(), treeviewConfigStore);
			console.log('TreeView initialized with layers:', treeviewStore.getNodes());
		};

		initializeWebMap();
	});

	// =====================================
	// DOWNLOAD STATE MANAGEMENT
	// =====================================

	/**
	 * Handles download state changes for a node.
	 * Adds or removes the node from the data selection store.
	 * @param node - The node to update download state for
	 * @param isActive - Whether the node should be available for download
	 */
	function onDownloadStateChanged(node: TreeNode, isActive: boolean): void {
		if (isActive) {
			const selectedData: DataSelection = {
				layerId: node.id,
				name: node.layer.title || '',
				fields: new SvelteSet<string>(
					(node.layer as __esri.FeatureLayer).fields?.map((field) => field.name) || []
				)
			};
			dataSelectionStore.addSelection(selectedData);
		} else {
			dataSelectionStore.removeSelection(node.id);
		}
	}

	/**
	 * Gets the current download state for a node.
	 * @param node - The node to check download state for
	 * @returns True if the node is selected for download
	 */
	function getDownloadState(node: TreeNode): boolean {
		return dataSelectionStore.DataSelections.has(node.id);
	}

	// =====================================
	// FILTER MANAGEMENT
	// =====================================

	/**
	 * Handles filter button clicks for a node.
	 * Toggles the filter menu for the specified layer.
	 * @param nodeId - The ID of the node to toggle filters for
	 */
	function handleFilterClicked(nodeId: string): void {
		const currentActiveLayer = fieldFilterMenuStore.ActiveLayer;

		if (currentActiveLayer?.uid === nodeId) {
			// Close filter menu if clicking on the currently active layer
			fieldFilterMenuStore.ActiveLayer = null;
		} else {
			// Open filter menu for the clicked layer
			const layer = treeviewStore.getNodeById(nodeId)?.layer as __esri.Layer;
			fieldFilterMenuStore.ActiveLayer = layer;
		}
	}

	/**
	 * Checks if a node has filters applied.
	 * @param nodeId - The ID of the node to check
	 * @returns True if the node has active filters applied
	 */
	function hasFiltersApplied(nodeId: string): boolean {
		const dataSelection = dataSelectionStore.DataSelections.get(nodeId);
		if (!dataSelection?.fields) {
			return false;
		}

		const node: TreeNode | undefined = treeviewStore.getNodeById(nodeId);
		if (!node) {
			return false;
		}

		const totalFields = (node.layer as __esri.FeatureLayer).fields?.length || 0;
		const selectedFields = dataSelection.fields.size;

		// Consider filters applied if not all fields are selected or no fields are selected
		return selectedFields > 0 && selectedFields !== totalFields;
	}
</script>

<TreeView.Root>
	{#each treeviewStore.getNodes() as node (node.id)}
		<Node
			{treeviewConfigStore}
			{node}
			isDownloadable={treeviewConfigStore.getItemConfig(node.id)?.isDownloadable ?? false}
			onNodeClick={() => {}}
			onNodeVisibilityChange={(node, visible) => treeviewStore.setVisibilityState(node.id, visible)}
			getNodeVisibility={(nodeId) => treeviewStore.getVisibilityState(nodeId)}
			{onDownloadStateChanged}
			{getDownloadState}
			onFilterClicked={handleFilterClicked}
			{hasFiltersApplied}
			depth={0}
			useLayerTypeIcon={true}
		/>
	{/each}
</TreeView.Root>

<style>
</style>
