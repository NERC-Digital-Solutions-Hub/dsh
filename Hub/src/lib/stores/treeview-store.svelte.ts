import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store.js';
import type { TreeNode } from '$lib/components/common/services/uprn/tree-view/types.js';
import type { TreeviewNodeConfig, VisibilityGroupConfig } from '$lib/types/treeview.js';
import { SvelteMap } from 'svelte/reactivity';

export class TreeviewStore {
	#configStore: TreeviewConfigStore | null = null;

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

	initialize(layers: __esri.Layer[], configStore: TreeviewConfigStore) {
		if (!configStore) {
			throw new Error('TreeviewStore requires a valid TreeviewConfigStore to initialize.');
		}

		this.#configStore = configStore;

		if (!layers) {
			throw new Error('TreeviewStore requires a valid array of layers to initialize.');
		}

		this.#treeNodes = this.#buildTreeFromLayers(layers);
	}

	getNodeById(id: string): TreeNode | undefined {
		return this.#treeNodesLookup.get(id);
	}

	getNodes(): TreeNode[] {
		return this.#treeNodes;
	}

	getVisibleNodes(): TreeNode[] {
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
		return this.#getNonHiddenNodes(this.#treeNodes);
	}

	#getNonHiddenNodes(nodes: TreeNode[]): TreeNode[] {
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
		return this.#visibilityState.get(nodeId) ?? false;
	}

	setVisibilityState(nodeId: string, isVisible: boolean): void {
		const node = this.#treeNodesLookup.get(nodeId);
		if (!node) {
			throw new Error(`Tree node not found for ID: ${nodeId}`);
		}

		this.#visibilityState.set(nodeId, isVisible);
		node.layer.visible = isVisible;
		this.#updateParentVisibility(node, isVisible);

		if (node.visibilityDependencyIds?.length) {
			this.#updateDependencyVisibility(node, isVisible);
		}

		if (!node.visibilityGroupId) {
			return;
		}

		const groupId: string = node.visibilityGroupId;
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
			if (node) {
				node.layer.visible = false;
				this.#updateParentVisibility(node, false);

				if (node.visibilityDependencyIds?.length) {
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

		if (node.visibilityDependencyIds?.length) {
			this.#updateDependencyVisibility(node, isVisible);
		}
	}

	#updateParentVisibility(node: TreeNode, isVisible: boolean): void {
		if (!node.parent) {
			return;
		}

		this.#visibilityState.set(node.parent.id, isVisible);
		node.parent.layer.visible = isVisible;
		this.#updateParentVisibility(node.parent, isVisible);
	}

	#updateDependencyVisibility(node: TreeNode, isVisible: boolean): void {
		if (!node.visibilityDependencyIds?.length) {
			return;
		}

		for (const depId of node.visibilityDependencyIds) {
			const depNode = this.#treeNodesLookup.get(depId);
			if (depNode) {
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
			const itemConfig = this.#findTreeviewItemConfig(layer.id);
			return this.#layerToNode(layer, undefined, itemConfig);
		});

		return this.#reverseTreeOrder([...rootNodes]); // reverse the order to match expected display (map layers are typically reverse ordered)
	}

	/**
	 * Finds the configuration for a treeview item by its ID.
	 * @param id - The ID of the item to find config for
	 * @returns The item configuration or undefined if not found
	 */
	#findTreeviewItemConfig(id: string): TreeviewNodeConfig | undefined {
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
	#layerToNode(layer: __esri.Layer, parent?: TreeNode, itemConfig?: TreeviewNodeConfig): TreeNode {
		const node: TreeNode = {
			id: layer.id,
			name: layer.title as string,
			layer: layer,
			visibilityDependencyIds: itemConfig?.visibilityDependencyIds,
			visibilityGroupId: itemConfig?.visibilityGroupId,
			children: [],
			parent: parent
		};

		layer.visible = itemConfig?.isVisibleOnInit ?? false;
		this.#visibilityState.set(layer.id, layer.visible);

		if (this.#isGroupLayer(layer)) {
			const groupLayer = layer as __esri.GroupLayer;
			node.children = groupLayer.layers.toArray().map((childLayer) => {
				const childItemConfig = this.#getChildItemConfig(childLayer, itemConfig);
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

	/**
	 * gets the item config for a child layer, falling back to parent config if not defined for certain properties
	 * @param childLayer the child layer
	 * @param parentItemConfig the parent item config to fall back to
	 * @returns the child item config or undefined if not found
	 */
	#getChildItemConfig(
		childLayer: __esri.Layer,
		parentItemConfig?: TreeviewNodeConfig
	): TreeviewNodeConfig | undefined {
		if (!this.#configStore) {
			return undefined;
		}

		if (!parentItemConfig) {
			return undefined;
		}

		const childItemConfig = this.#configStore.getItemConfig(childLayer.id);
		return {
			id: childLayer.id,
			isDownloadable: childItemConfig?.isDownloadable,
			isVisibleOnInit: childItemConfig?.isVisibleOnInit,
			isHidden: childItemConfig?.isHidden,
			visibilityDependencyIds:
				childItemConfig?.visibilityDependencyIds ?? parentItemConfig.visibilityDependencyIds,
			visibilityGroupId: childItemConfig?.visibilityGroupId ?? parentItemConfig.visibilityGroupId
		};
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
	#sublayerToNode(subLayer: __esri.Sublayer): TreeNode {
		const node: TreeNode = {
			id: subLayer.uid,
			name: subLayer.title as string,
			layer: subLayer,
			children: []
		};

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

	/**
	 * Determines if a layer is a group layer that can contain other layers.
	 * @param layer - The layer to check
	 * @returns True if the layer is a group layer
	 */
	#isGroupLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'group';
	}
}
