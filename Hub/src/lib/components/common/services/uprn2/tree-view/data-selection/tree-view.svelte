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
	import type { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store.js';
	import { DownloadState, TreeFieldNode, TreeLayerNode, type TreeNode } from '../types.js';
	import {
		dataSelectionStore,
	} from '$lib/stores/services/uprn2/data-selection-store.svelte';
	import FieldFilterMenuStore from '$lib/stores/services/uprn2/field-filter-menu-store.svelte';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';
	import { AliasPathNodeConverter } from '$lib/components/common/services/uprn2/tree-view/services/alias-path-node-converter';

	// =====================================
	// TYPES & PROPS
	// =====================================

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewConfigStore: TreeviewConfigStore;
		fieldsToHide?: Set<string>; // List of field names to hide in the tree
		fieldFilterMenuStore: FieldFilterMenuStore;
	};

	const {
		webMap = null,
		treeviewConfigStore,
		fieldFilterMenuStore,
		fieldsToHide
	}: Props = $props();

	const treeviewStore = new TreeviewStore();

	// =====================================
	// REACTIVE EFFECTS
	// =====================================

	/**
	 * Main effect that watches for webMap changes and rebuilds the layer tree.
	 * Initializes layer visibility and builds the tree structure.
	 */
	$effect(() => {
		if (!webMap || treeviewStore.initialized) {
			return;
		}

		const initializeWebMap = async () => {
			await webMap.when();
			await loadFeatureLayers(webMap.layers.toArray());
			console.log('[data-selection-tree-view] fields to hide:', fieldsToHide);

			const aliasPathConverter = new AliasPathNodeConverter(treeviewConfigStore);
			treeviewStore.initialize(webMap.layers.toArray(), treeviewConfigStore, [aliasPathConverter]);
			console.log('[data-selection-tree-view] Initialized with layers:', treeviewStore.getNodes());
		};

		initializeWebMap();
	});

	async function loadFeatureLayers(layers: __esri.Layer[]): Promise<void> {
		for (const layer of layers) {
			if (layer.type === 'feature' && !layer.loaded) {
				await layer.load();
				console.log('Loaded feature layer:', layer.title);
			}

			if (layer.type === 'group') {
				const groupLayer = layer as __esri.GroupLayer;
				await loadFeatureLayers(groupLayer.layers.toArray());
			}
		}
	}

	// =====================================
	// DOWNLOAD STATE MANAGEMENT
	// =====================================

	/**
	 * Handles download state changes for a node.
	 * Adds or removes the node from the data selection store.
	 * @param node - The node to update download state for
	 * @param downloadState - The new download state of the node.
	 */
	function onDownloadStateChanged(node: TreeNode, downloadState: DownloadState): void {
		dataSelectionStore.updateSelection(node, downloadState);
	}

	/**
	 * Gets the current download state for a node.
	 * @param node - The node to check download state for
	 * @returns The download state of the node
	 */
	function getDownloadState(node: TreeNode): DownloadState {
		return dataSelectionStore.getSelectionState(node);
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
			return;
		}

		// Open filter menu for the clicked layer
		const node = treeviewStore.getNodeById(nodeId);
		if (!node || !(node instanceof TreeLayerNode)) {
			return;
		}

		fieldFilterMenuStore.ActiveLayer = node.layer as __esri.Layer;
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
		if (!node || !(node instanceof TreeLayerNode)) {
			return false;
		}

		const totalFields = (node.layer as __esri.FeatureLayer).fields?.length || 0;
		const selectedFields = dataSelection.fields.size;

		// Consider filters applied if not all fields are selected or no fields are selected
		return selectedFields > 0 && selectedFields !== totalFields;
	}
</script>

{#if treeviewStore.initialized}
	<TreeView.Root>
		{#each treeviewStore.getNodes() as node (node.id)}
			{@const _dbg = console.log('parent pass', !!treeviewConfigStore)}
			<Node
				{treeviewConfigStore}
				{node}
				isDownloadable={treeviewConfigStore.getItemConfig(node.id)?.isDownloadable ?? true}
				onNodeClick={() => {}}
				onNodeVisibilityChange={(node, visible) =>
					treeviewStore.setVisibilityState(node.id, visible)}
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
{/if}

<style>
</style>
