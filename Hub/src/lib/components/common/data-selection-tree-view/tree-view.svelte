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
	import type { TreeNode } from './types.js';
	import type { TreeviewConfig, TreeviewLayerConfig } from '$lib/utils/app-config-provider.js';
	import { dataSelectionStore, type DataSelection } from '$lib/stores/data-selection-store.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';

	// =====================================
	// TYPES & PROPS
	// =====================================

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewConfig?: TreeviewConfig | null;
		fieldFilterMenuStore: FieldFilterMenuStore;
	};

	const { webMap = null, treeviewConfig = null, fieldFilterMenuStore }: Props = $props();

	// =====================================
	// STATE VARIABLES
	// =====================================

	/** The hierarchical tree structure of map layers */
	let layerTree: TreeNode[] = $state<TreeNode[]>([]);

	/**
	 * Lookup map for quick access to any tree node by its ID.
	 * Automatically rebuilds when layerTree changes.
	 */
	let layerTreeLookup: Map<string, TreeNode> = $derived.by(() => {
		const map = new Map<string, TreeNode>();
		addNodesToLookupMap(layerTree, map);
		return map;
	});

	/**
	 * Map of visibility groups to a map of node IDs and their visibility state.
	 * This enables managing visibility state per group.
	 */
	let visibilityState: Map<string | undefined, Map<string, boolean>> = $state(new Map());

	/**
	 * Tracks the active node in each visibility group to enforce single active visibility per group.
	 */
	let activeInVisibilityGroup: Map<string | undefined, string | undefined> = $state(new Map());

	// =====================================
	// UTILITY FUNCTIONS
	// =====================================

	/**
	 * Recursively adds all nodes from a tree structure to a lookup map for fast access.
	 * @param nodes - Array of tree nodes to process
	 * @param map - Map to populate with node ID -> node mappings
	 */
	function addNodesToLookupMap(nodes: TreeNode[], map: Map<string, TreeNode>): void {
		for (const node of nodes) {
			map.set(node.id, node);
			if (node.children?.length) {
				addNodesToLookupMap(node.children, map);
			}
		}
	}

	/**
	 * Determines if a layer is a group layer that can contain other layers.
	 * @param layer - The layer to check
	 * @returns True if the layer is a group layer
	 */
	function isGroupLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'group';
	}

	// =====================================
	// REACTIVE EFFECTS
	// =====================================

	/**
	 * Main effect that watches for webMap changes and rebuilds the layer tree.
	 * Initializes layer visibility and builds the tree structure.
	 */
	$effect(() => {
		if (!webMap) {
			layerTree = [];
			return;
		}

		const initializeWebMap = async () => {
			await webMap.when();

			// Initially hide all layers to prevent unwanted visibility
			hideAllLayers(webMap);

			// Build the tree structure and initialize visibility state
			const tree = await buildTreeFromMap(webMap);
			layerTree = tree;
			initializeVisibilityState(tree);
		};

		initializeWebMap();
	});

	// =====================================
	// LAYER MANIPULATION FUNCTIONS
	// =====================================

	/**
	 * Recursively sets the visibility of a layer and all its children.
	 * @param layer - The layer to set visibility for
	 * @param visible - Whether the layer should be visible
	 */
	function setLayerVisibility(layer: __esri.Layer, visible: boolean): void {
		if ('visible' in layer) {
			layer.visible = visible;
		}

		if (isGroupLayer(layer)) {
			const groupLayer = layer as __esri.GroupLayer;
			groupLayer.layers.forEach((childLayer) => setLayerVisibility(childLayer, visible));
		}
	}

	/**
	 * Hides all layers in the web map initially.
	 * @param map - The web map containing layers to hide
	 */
	function hideAllLayers(map: __esri.WebMap): void {
		for (const layer of map.layers) {
			setLayerVisibility(layer, false);
		}
	}

	// =====================================
	// VISIBILITY STATE MANAGEMENT
	// =====================================

	/**
	 * Initializes the visibility state for all nodes in the tree.
	 * Creates a map structure to track visibility per visibility group.
	 * @param nodes - The tree nodes to initialize visibility state for
	 */
	function initializeVisibilityState(nodes: TreeNode[]): void {
		const newVisibilityState = new Map<string, Map<string, boolean>>();
		addNodeVisibilityToState(nodes, newVisibilityState);
		visibilityState = newVisibilityState;
	}

	/**
	 * Recursively adds visibility state for nodes to the visibility state map.
	 * @param nodeList - List of nodes to process
	 * @param stateMap - Map to populate with visibility state
	 */
	function addNodeVisibilityToState(
		nodeList: TreeNode[],
		stateMap: Map<string, Map<string, boolean>>
	): void {
		for (const node of nodeList) {
			const visibilityGroup = node.visibilityGroup || '';
			const group: Map<string, boolean> = stateMap.get(visibilityGroup) || new Map();
			group.set(node.id, node.layer.visible);
			stateMap.set(visibilityGroup, group);

			if (node.children?.length) {
				addNodeVisibilityToState(node.children, stateMap);
			}
		}
	}

	// =====================================
	// TREE BUILDING FUNCTIONS
	// =====================================

	/**
	 * Builds a tree structure from the web map layers.
	 * Applies configuration filters and reverses layer order to match expected display order.
	 * @param map - The web map to build the tree from
	 * @returns Promise resolving to the root tree nodes
	 */
	async function buildTreeFromMap(map: __esri.Map): Promise<TreeNode[]> {
		// Convert all map layers to tree nodes
		const rootNodes = await Promise.all(
			map.layers.toArray().map((layer) => {
				const layerConfig = findLayerConfig(layer.title || undefined);
				return layerToNode(layer, null, layerConfig);
			})
		);

		// Filter nodes based on configuration if available
		const filteredNodes = filterNodesByConfig(rootNodes);

		// Reverse the order to match expected display (map layers are typically reverse ordered)
		return reverseTreeOrder([...filteredNodes]);
	}

	/**
	 * Finds the configuration for a layer by its title/name.
	 * @param layerTitle - The title of the layer to find config for
	 * @returns The layer configuration or undefined if not found
	 */
	function findLayerConfig(layerTitle: string | undefined): TreeviewLayerConfig | undefined {
		if (!layerTitle) return undefined;
		return treeviewConfig?.layers.find((cfg) => cfg.name === layerTitle);
	}

	/**
	 * Filters tree nodes based on the treeview configuration.
	 * If no configuration is provided, returns all nodes.
	 * @param nodes - The nodes to filter
	 * @returns Filtered array of nodes
	 */
	function filterNodesByConfig(nodes: TreeNode[]): TreeNode[] {
		return treeviewConfig
			? nodes.filter((node) => treeviewConfig.layers.some((config) => config.name === node.name))
			: nodes;
	}

	/**
	 * Recursively reverses the order of nodes and their children.
	 * This is needed because map layers are typically in reverse display order.
	 * @param nodes - The nodes to reverse
	 * @returns The nodes in reversed order
	 */
	function reverseTreeOrder(nodes: TreeNode[]): TreeNode[] {
		nodes.reverse();
		for (const node of nodes) {
			if (node.children?.length) {
				reverseTreeOrder(node.children);
			}
		}
		return nodes;
	}

	/**
	 * Converts a map layer to a tree node, handling different layer types.
	 * Recursively processes group layers and sublayers.
	 * @param layer - The layer to convert
	 * @param parent - The parent node (null for root nodes)
	 * @param layerConfig - Optional configuration for the layer
	 * @returns Promise resolving to the created tree node
	 */
	async function layerToNode(
		layer: __esri.Layer,
		parent?: TreeNode | null,
		layerConfig?: TreeviewLayerConfig
	): Promise<TreeNode> {
		// Attempt to load the layer, but don't fail if it can't be loaded
		try {
			await layer.load();
		} catch (error) {
			console.warn('Unable to fully load layer for tree view', layer.title, error);
		}

		const base: TreeNode = {
			id: layer.uid,
			name: layer.title as string,
			layer: layer,
			visibilityGroup: layerConfig?.visibilityGroup,
			children: [],
			parent: parent || null
		};

		// Handle group layers by processing their children
		if (isGroupLayer(layer)) {
			const groupLayer = layer as __esri.GroupLayer;
			base.children = await Promise.all(
				groupLayer.layers.toArray().map((childLayer) => layerToNode(childLayer, base, layerConfig))
			);
			return base;
		}

		// Handle layers with sublayers (MapImageLayer, WMSLayer)
		if (hasSubLayers(layer)) {
			const layerWithSublayers = layer as __esri.MapImageLayer | __esri.WMSLayer;
			if (layerWithSublayers.sublayers && layerWithSublayers.sublayers.length > 0) {
				base.children = await sublayerCollectionToNodes(
					layerWithSublayers.sublayers as __esri.Collection<__esri.Sublayer>
				);
			}
		}

		return base;
	}

	/**
	 * Checks if a layer has sublayers (MapImageLayer or WMSLayer).
	 * @param layer - The layer to check
	 * @returns True if the layer has sublayers
	 */
	function hasSubLayers(layer: __esri.Layer): boolean {
		return layer.type === 'map-image' || layer.type === 'wms';
	}

	/**
	 * Converts a collection of sublayers to tree nodes.
	 * @param sublayers - Collection of sublayers to convert
	 * @returns Promise resolving to array of tree nodes
	 */
	async function sublayerCollectionToNodes(
		sublayers: __esri.Collection<__esri.Sublayer>
	): Promise<TreeNode[]> {
		return Promise.all(sublayers.toArray().map(sublayerToNode));
	}

	/**
	 * Converts a single sublayer to a tree node.
	 * Recursively processes nested sublayers.
	 * @param subLayer - The sublayer to convert
	 * @returns Promise resolving to the created tree node
	 */
	async function sublayerToNode(subLayer: __esri.Sublayer): Promise<TreeNode> {
		try {
			await subLayer.load();
		} catch (error) {
			console.warn('Unable to fully load sublayer for tree view', subLayer.title, error);
		}

		const node: TreeNode = {
			id: subLayer.uid,
			name: subLayer.title as string,
			layer: subLayer,
			children: []
		};

		// Process nested sublayers if they exist
		if (subLayer.sublayers?.length) {
			node.children = await sublayerCollectionToNodes(subLayer.sublayers);
		}

		return node;
	}

	// =====================================
	// VISIBILITY MANAGEMENT FUNCTIONS
	// =====================================

	/**
	 * Handles the visibility toggle for a tree node.
	 * Manages visibility groups and parent-child relationships.
	 * @param node - The node to toggle visibility for
	 * @param visible - Whether the node should be visible
	 */
	function handleNodeVisibleToggle(node: TreeNode, visible: boolean): void {
		if (!isValidVisibilityNode(node)) {
			return;
		}

		setNodeVisibilityState(node, visible);
		handleParentLayerVisibility(node, visible);

		// Force reactivity update
		visibilityState = new Map(visibilityState);
	}

	/**
	 * Checks if a node is valid for visibility operations.
	 * @param node - The node to validate
	 * @returns True if the node can have its visibility changed
	 */
	function isValidVisibilityNode(node: TreeNode): boolean {
		return !!(node?.layer && 'visible' in node.layer);
	}

	/**
	 * Handles visibility logic for parent layers when a child's visibility changes.
	 * @param node - The child node whose visibility changed
	 * @param visible - Whether the child node is now visible
	 */
	function handleParentLayerVisibility(node: TreeNode, visible: boolean): void {
		const parentLayer = node.parent?.layer as __esri.GroupLayer;
		if (!parentLayer || !isGroupLayer(parentLayer)) {
			return;
		}

		const anyChildVisible = parentLayer.layers.some((layer) => layer.visible);

		if (visible && anyChildVisible) {
			setNodeVisibility(node.parent as TreeNode, true);
			activateParentChain(node.parent as TreeNode);
		}

		// Hide parent if no children are visible
		if (!anyChildVisible) {
			setNodeVisibility(node.parent as TreeNode, false);
		}
	}

	/**
	 * Recursively activates parent group layers up the chain.
	 * @param parentNode - The parent node to activate
	 */
	function activateParentChain(parentNode: TreeNode): void {
		if (!isGroupLayer(parentNode.layer)) {
			return;
		}

		const groupLayer = parentNode.layer as __esri.GroupLayer;
		if (!groupLayer.visible && groupLayer.layers.some((layer) => layer.visible)) {
			setNodeVisibility(parentNode, true);
		}

		const grandParentNode = parentNode.parent;
		if (grandParentNode && isGroupLayer(grandParentNode.layer)) {
			activateParentChain(grandParentNode);
		}
	}

	/**
	 * Sets the visibility state for a node and manages visibility groups.
	 * Enforces single active visibility per group when applicable.
	 * @param node - The node to set visibility state for
	 * @param visible - Whether the node should be visible
	 */
	function setNodeVisibilityState(node: TreeNode, visible: boolean): void {
		if (!isValidVisibilityNode(node)) {
			return;
		}

		node.layer.visible = visible;

		// Handle visibility group constraints (only one active per group)
		const visibilityGroup = node.visibilityGroup || '';
		const currentActiveNodeId = activeInVisibilityGroup.get(visibilityGroup);

		if (visible && currentActiveNodeId && currentActiveNodeId !== node.id) {
			// Deactivate the previously active node in this group
			const previousNode = layerTreeLookup.get(currentActiveNodeId);
			if (previousNode) {
				handleNodeVisibleToggle(previousNode, false);
			}
		}

		// Update the active node for this visibility group
		activeInVisibilityGroup.set(visibilityGroup, visible ? node.id : undefined);
		setNodeVisibility(node, visible);
	}

	/**
	 * Sets the visibility of a node and updates the visibility state tracking.
	 * @param node - The node to set visibility for
	 * @param visible - Whether the node should be visible
	 */
	function setNodeVisibility(node: TreeNode, visible: boolean): void {
		if (!isValidVisibilityNode(node)) {
			return;
		}

		node.layer.visible = visible;

		// Update visibility state tracking
		const visibilityGroup = node.visibilityGroup || '';
		const group = visibilityState.get(visibilityGroup) || new Map();
		group.set(node.id, visible);
		visibilityState.set(visibilityGroup, group);

		// Force reactivity update
		visibilityState = new Map(visibilityState);
	}

	/**
	 * Gets the visibility state of a node by its ID.
	 * @param nodeId - The ID of the node to check
	 * @returns The visibility state or undefined if not found
	 */
	function getNodeVisibility(nodeId: string): boolean | undefined {
		const node = layerTreeLookup.get(nodeId);
		if (!node) {
			return undefined;
		}

		const group = visibilityState.get(node.visibilityGroup || '');
		return group?.get(nodeId);
	}

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
			const layer = layerTreeLookup.get(nodeId)?.layer as __esri.Layer;
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
		const node = layerTreeLookup.get(nodeId);

		if (!dataSelection?.fields || !node) {
			return false;
		}

		const totalFields = (node.layer as __esri.FeatureLayer).fields?.length || 0;
		const selectedFields = dataSelection.fields.size;

		// Consider filters applied if not all fields are selected or no fields are selected
		return selectedFields > 0 && selectedFields !== totalFields;
	}
</script>

<TreeView.Root>
	{#each layerTree as node (node.id)}
		<Node
			{treeviewConfig}
			{node}
			isDownloadable={treeviewConfig?.layers.find((cfg) => cfg.name === node.name)
				?.isDownloadable ?? true}
			onNodeClick={() => {}}
			onNodeVisibilityChange={handleNodeVisibleToggle}
			{getNodeVisibility}
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
