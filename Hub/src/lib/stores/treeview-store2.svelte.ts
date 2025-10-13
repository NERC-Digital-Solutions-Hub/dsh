import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store.js';
import {
	TreeNode,
	TreeLayerNode,
	TreeFieldNode
} from '$lib/components/common/services/uprn2/tree-view/types.js';
import {
	type TreeviewItemConfig,
	TreeviewItemType,
	type VisibilityGroupConfig
} from '$lib/types/treeview.js';
import { getLayerTreeviewItemType } from '$lib/utils/treeview.js';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export class TreeviewStore {
	public initialized: boolean = $state<boolean>(false);

	#configStore: TreeviewConfigStore | null = null;
	#fieldsToHide: SvelteSet<string> = new SvelteSet();

	/** The hierarchical tree structure of map layers */
	#treeNodes: TreeNode[] = $state<TreeNode[]>([]);

	/**
	 * Lookup map for quick access to any tree node by its ID.
	 * Automatically rebuilds when layerTree changes.
	 */
	#treeNodesLookup: SvelteMap<string, TreeNode> = $derived.by(() => {
		const map = new SvelteMap<string, TreeNode>();
		this.#addNodesToLookupMap(this.#treeNodes, map);
		return map;
	});

	/**
	 * Map of visibility groups to a map of node IDs and their visibility state.
	 * This enables managing visibility state per group.
	 */
	#visibilityState: SvelteMap<string, boolean> = $state(new SvelteMap());

	/**
	 * Tracks the active node in each visibility group to enforce single active visibility per group.
	 */
	#activeInVisibilityGroup: SvelteMap<string, string[]> = $state(new SvelteMap());

	initialize(
		layers: __esri.Layer[],
		configStore: TreeviewConfigStore,
		fieldsToHide?: Set<string>
	): void {
		if (this.initialized) {
			throw new Error('TreeviewStore is already initialized.');
		}

		this.initialized = true;

		if (!configStore) {
			throw new Error('TreeviewStore requires a valid TreeviewConfigStore to initialize.');
		}

		this.#configStore = configStore;

		if (!layers) {
			throw new Error('TreeviewStore requires a valid array of layers to initialize.');
		}

		if (fieldsToHide) {
			this.#fieldsToHide = new SvelteSet(fieldsToHide);
		}

		this.#treeNodes = this.#buildTreeFromLayers(layers);
	}

	getNodeById(id: string): TreeNode | undefined {
		this.#checkInitialized();
		return this.#treeNodesLookup.get(id);
	}

	getNodes(): TreeNode[] {
		this.#checkInitialized();
		return this.#treeNodes;
	}

	getVisibleNodes(): TreeNode[] {
		this.#checkInitialized();
		const visibleNodes: TreeNode[] = [];
		for (const [nodeId, isVisible] of this.#visibilityState) {
			if (!isVisible) {
				continue;
			}

			const node = this.#treeNodesLookup.get(nodeId);
			if (node) {
				visibleNodes.push(node);
			}
		}

		return visibleNodes;
	}

	getNonHiddenNodes(): TreeNode[] {
		this.#checkInitialized();
		return this.#getNonHiddenNodes(this.#treeNodes);
	}

	#getNonHiddenNodes(nodes: TreeNode[]): TreeNode[] {
		this.#checkInitialized();
		const nonHiddenNodes: TreeNode[] = [];
		for (const node of nodes) {
			const itemConfig = this.#findTreeviewItemConfig(node.id);
			if (itemConfig && itemConfig.isHidden) {
				continue;
			}

			nonHiddenNodes.push(node);

			if (node.children?.length) {
				const childNonHidden = this.#getNonHiddenNodes(node.children);
				nonHiddenNodes.push(...childNonHidden);
			}
		}

		return nonHiddenNodes;
	}

	/**
	 * Gets the visibility state of a node by its ID.
	 * @param nodeId - The ID of the node to check visibility for
	 * @returns True if the node is visible, otherwise false
	 */
	getVisibilityState(nodeId: string): boolean {
		this.#checkInitialized();
		return this.#visibilityState.get(nodeId) ?? false;
	}

	setVisibilityState(nodeId: string, isVisible: boolean): void {
		this.#checkInitialized();
		const node = this.#treeNodesLookup.get(nodeId);
		if (!node) {
			throw new Error(`Tree node not found for ID: ${nodeId}`);
		}

		if (!(node instanceof TreeLayerNode)) {
			throw new Error(`Tree node is not a layer node: ${nodeId}`);
		}

		this.#visibilityState.set(nodeId, isVisible);
		node.layer.visible = isVisible;
		if (node instanceof TreeFieldNode) {
			node.featureLayer.displayField = isVisible ? node.field.name : '';
		}

		this.#updateParentVisibility(node, isVisible);

		const config = this.#findTreeviewItemConfig(nodeId);
		if (!config || config.isHidden) {
			return;
		}

		if (config.visibilityDependencyIds?.length) {
			this.#updateDependencyVisibility(node, isVisible);
		}

		if (!config.visibilityGroupId) {
			return;
		}

		const groupId: string = config.visibilityGroupId;
		console.log(`Node ${nodeId} is part of visibility group ${groupId}`);
		let activeNodes: string[] | undefined = this.#activeInVisibilityGroup.get(groupId);
		if (!activeNodes) {
			activeNodes = [];
			this.#activeInVisibilityGroup.set(groupId, activeNodes);
		}

		const visibilityGroupConfig: VisibilityGroupConfig | undefined =
			this.#findVisibilityGroupConfig(groupId);
		if (!visibilityGroupConfig) {
			throw new Error(`Visibility group config not found for group ID: ${groupId}`);
		}

		if (!isVisible) {
			const index = activeNodes.indexOf(nodeId);
			activeNodes.splice(index, 1);
			return;
		}

		const hideId = (id: string) => {
			this.#visibilityState.set(id, false);
			const node = this.#treeNodesLookup.get(id);
			if (node && node instanceof TreeLayerNode) {
				node.layer.visible = false;
				this.#updateParentVisibility(node, false);

				const config = this.#findTreeviewItemConfig(id);
				if (config && config.visibilityDependencyIds?.length) {
					this.#updateDependencyVisibility(node, false);
				}
			}
			const index = activeNodes.indexOf(id);
			if (index >= 0) {
				activeNodes.splice(index, 1);
			}
		};

		while (activeNodes.length >= visibilityGroupConfig.maxVisibleLayers) {
			const oldestId = activeNodes[0]; // oldest is at the front
			hideId(oldestId);
		}

		activeNodes.push(nodeId);
		this.#updateParentVisibility(node, isVisible);

		if (config.visibilityDependencyIds?.length) {
			this.#updateDependencyVisibility(node, isVisible);
		}
	}

	#updateParentVisibility(node: TreeNode, isVisible: boolean): void {
		const parentNode = node.parent;
		if (!parentNode || !(parentNode instanceof TreeLayerNode)) {
			return;
		}

		this.#visibilityState.set(parentNode.id, isVisible);
		parentNode.layer.visible = isVisible;
		this.#updateParentVisibility(parentNode, isVisible);
	}

	#updateDependencyVisibility(node: TreeNode, isVisible: boolean): void {
		const config = this.#findTreeviewItemConfig(node.id);
		if (!config) {
			return;
		}

		if (!config.visibilityDependencyIds?.length) {
			return;
		}

		for (const depId of config.visibilityDependencyIds) {
			const depNode = this.#treeNodesLookup.get(depId);
			if (depNode && depNode instanceof TreeLayerNode) {
				this.#visibilityState.set(depId, isVisible);
				depNode.layer.visible = isVisible;
				this.#updateParentVisibility(depNode, isVisible);
			}
		}
	}

	#findVisibilityGroupConfig(id: string): VisibilityGroupConfig | undefined {
		if (!id) {
			return undefined;
		}

		if (!this.#configStore) {
			return undefined;
		}

		return this.#configStore.getVisibilityGroupConfig(id);
	}

	/**
	 * Builds a tree structure from the map layers.
	 * Applies configuration filters and reverses layer order to match expected display order.
	 * @param layers - The layers to build the tree from
	 * @returns An array of the root tree nodes
	 */
	#buildTreeFromLayers(layers: __esri.Layer[]): TreeNode[] {
		const rootNodes = layers.map((layer) => {
			const itemConfig = this.#getOrCreateLayerNodeItemConfig(layer);
			return this.#layerToNode(layer, undefined, itemConfig);
		});

		return this.#reverseTreeOrder([...rootNodes]); // reverse the order to match expected display (map layers are typically reverse ordered)
	}

	/**
	 * Finds the configuration for a treeview item by its ID.
	 * @param id - The ID of the item to find config for
	 * @returns The item configuration or undefined if not found
	 */
	#findTreeviewItemConfig(id: string): TreeviewItemConfig | undefined {
		if (!id) {
			return undefined;
		}

		if (!this.#configStore) {
			return undefined;
		}

		return this.#configStore.getItemConfig(id);
	}

	/**
	 * Recursively reverses the order of nodes and their children.
	 * This is needed because map layers are typically in reverse display order.
	 * @param nodes - The nodes to reverse
	 * @returns The nodes in reversed order
	 */
	#reverseTreeOrder(nodes: TreeNode[]): TreeNode[] {
		nodes.reverse();
		for (const node of nodes) {
			if (node.children?.length) {
				this.#reverseTreeOrder(node.children);
			}
		}
		return nodes;
	}

	/**
	 * Converts a map layer to a tree node item, handling different layer types.
	 * Recursively processes group layers and sublayers.
	 * @param layer - The layer to convert
	 * @param parent - The parent node, if any
	 * @param itemConfig - Optional configuration for the item
	 * @returns The created tree node
	 */
	#layerToNode(
		layer: __esri.Layer,
		parent?: TreeNode,
		itemConfig?: TreeviewItemConfig
	): TreeLayerNode {
		const node = new TreeLayerNode(layer.id, layer.title as string, layer, [], parent);

		layer.visible = itemConfig?.isVisibleOnInit ?? false;
		this.#visibilityState.set(layer.id, layer.visible);

		if (this.#isFeatureLayer(layer) && itemConfig?.showFields) {
			const featureLayer = layer as __esri.FeatureLayer;
			if (!featureLayer.loaded) {
				console.warn(`Layer not loaded: ${layer.id}`);
			}

			for (const field of featureLayer.fields ?? []) {
				const fieldNode = this.#fieldToNode(field, node, itemConfig);
				node.children.push(fieldNode);
			}
		}

		if (this.#isGroupLayer(layer)) {
			const groupLayer = layer as __esri.GroupLayer;
			node.children = groupLayer.layers.toArray().map((childLayer) => {
				const childItemConfig = this.#getOrCreateLayerNodeItemConfig(childLayer, itemConfig);
				return this.#layerToNode(childLayer, node, childItemConfig);
			});
			return node;
		}

		if (this.#hasSubLayers(layer)) {
			const layerWithSublayers = layer as __esri.MapImageLayer | __esri.WMSLayer;
			if (layerWithSublayers.sublayers && layerWithSublayers.sublayers.length > 0) {
				const sublayerCollection =
					layerWithSublayers.sublayers as __esri.Collection<__esri.Sublayer>;
				node.children = sublayerCollection.toArray().map(this.#sublayerToNode);
			}
		}

		return node;
	}

	#fieldToNode(
		field: __esri.Field,
		parentLayerNode: TreeLayerNode,
		parentItemConfig?: TreeviewItemConfig
	): TreeFieldNode {
		const fieldNodeId: string = this.#getFieldNodeId(parentLayerNode.id, field.name);
		const fieldNode = new TreeFieldNode(
			fieldNodeId,
			field.alias || field.name,
			parentLayerNode.layer as __esri.FeatureLayer,
			field,
			[],
			parentLayerNode
		);

		const fieldItemConfig: TreeviewItemConfig | undefined = this.#getOrCreateFieldNodeItemConfig(
			fieldNodeId,
			field.alias || field.name,
			parentItemConfig
		);

		this.#visibilityState.set(fieldNodeId, fieldItemConfig?.isVisibleOnInit ?? false);
		return fieldNode;
	}

	#getOrCreateLayerNodeItemConfig(
		layer: __esri.Layer,
		parentItemConfig?: TreeviewItemConfig
	): TreeviewItemConfig | undefined {
		const itemConfig: TreeviewItemConfig | undefined = this.#getOrCreateNodeItemConfig(
			layer.id,
			parentItemConfig
		);
		if (itemConfig && itemConfig.type === TreeviewItemType.None) {
			itemConfig.type = getLayerTreeviewItemType(layer);
		}

		return itemConfig;
	}

	#getOrCreateFieldNodeItemConfig(
		nodeId: string,
		fieldName: string,
		parentItemConfig?: TreeviewItemConfig
	): TreeviewItemConfig | undefined {
		const itemConfig: TreeviewItemConfig | undefined = this.#getOrCreateNodeItemConfig(
			nodeId,
			parentItemConfig
		);
		if (itemConfig) {
			if (itemConfig.type === TreeviewItemType.None) {
				itemConfig.type = TreeviewItemType.Field;
			}

			if (this.#fieldsToHide.has(fieldName.trim().toLowerCase())) {
				itemConfig.isHidden = true;
			}
		}

		return itemConfig;
	}

	/**
	 * gets or creates the item config for a node, falling back to parent config if not defined for certain properties
	 * @param nodeId the node identifier
	 * @param parentItemConfig the parent item config to fall back to
	 * @returns the node item config or undefined if not found
	 */
	#getOrCreateNodeItemConfig(
		nodeId: string,
		parentItemConfig?: TreeviewItemConfig
	): TreeviewItemConfig | undefined {
		if (!this.#configStore) {
			return undefined;
		}

		let itemConfig: TreeviewItemConfig | undefined = this.#configStore.getItemConfig(nodeId);
		const createNewConfig: boolean = !itemConfig;

		if (createNewConfig) {
			itemConfig = {
				id: nodeId,
				type: TreeviewItemType.None,
				isDownloadable: itemConfig?.isDownloadable,
				isVisibleOnInit: itemConfig?.isVisibleOnInit,
				isHidden: itemConfig?.isHidden ?? parentItemConfig?.isHidden,
				visibilityDependencyIds:
					itemConfig?.visibilityDependencyIds ?? parentItemConfig?.visibilityDependencyIds,
				visibilityGroupId: itemConfig?.visibilityGroupId ?? parentItemConfig?.visibilityGroupId
			};

			this.#configStore.addItemConfig(itemConfig);
		}

		return itemConfig;
	}

	/**
	 * Checks if a layer has sublayers (MapImageLayer or WMSLayer).
	 * @param layer - The layer to check
	 * @returns True if the layer has sublayers
	 */
	#hasSubLayers(layer: __esri.Layer): boolean {
		return layer.type === 'map-image' || layer.type === 'wms';
	}

	/**
	 * Converts a single sublayer to a tree node.
	 * Recursively processes nested sublayers.
	 * @param subLayer - The sublayer to convert
	 * @returns The created tree node
	 */
	#sublayerToNode(subLayer: __esri.Sublayer): TreeLayerNode {
		const node = new TreeLayerNode(subLayer.uid, subLayer.title as string, subLayer);
		if (subLayer.sublayers?.length) {
			node.children = subLayer.sublayers.toArray().map(this.#sublayerToNode);
		}

		return node;
	}

	/**
	 * Recursively adds all nodes from a tree structure to a lookup map for fast access.
	 * @param nodes - Array of tree nodes to process
	 * @param map - Map to populate with node ID -> node mappings
	 */
	#addNodesToLookupMap(nodes: TreeNode[], map: Map<string, TreeNode>): void {
		for (const node of nodes) {
			map.set(node.id, node);
			if (node.children?.length) {
				this.#addNodesToLookupMap(node.children, map);
			}
		}
	}

	#getFieldNodeId(layerId: string, fieldName: string): string {
		return `${layerId}-${fieldName}`;
	}

	/**
	 * Determines if a layer is a group layer that can contain other layers.
	 * @param layer - The layer to check
	 * @returns True if the layer is a group layer
	 */
	#isGroupLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'group';
	}

	/**
	 * Determines if a layer is a feature layer that can contain fields.
	 * @param layer - The layer to check
	 * @returns True if the layer is a feature layer
	 */
	#isFeatureLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'feature';
	}

	#checkInitialized(): void {
		if (!this.initialized) {
			throw new Error('TreeviewStore is not initialized. Call initialize() first.');
		}
	}
}
