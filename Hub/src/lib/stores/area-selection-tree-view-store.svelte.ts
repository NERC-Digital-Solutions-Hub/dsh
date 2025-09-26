import { SvelteMap } from 'svelte/reactivity';
import type { TreeNode } from '$lib/components/common/area-selection-tree-view/types.js';
import type { TreeviewConfig } from '$lib/utils/app-config-provider.js';
import { toast } from 'svelte-sonner';

/**
 * Store for managing the area selection tree view state and operations.
 * Handles layer tree construction, visibility management, and layer selection.
 */
class AreaSelectionTreeviewStore {
	/**
	 * The layer tree structure built from the WebMap
	 */
	public layerTree: TreeNode[] = $state([]);

	/**
	 * The currently visible node (only one can be visible at a time)
	 */
	public visibleNode: TreeNode | null = $state(null);

	/**
	 * Lookup map for quick tree node access by ID
	 */
	public readonly treeNodeLookup = $derived.by(() => {
		const lookup = new SvelteMap<string, TreeNode>();

		const addToLookup = (nodes: TreeNode[]) => {
			for (const node of nodes) {
				lookup.set(node.id, node);
				if (node.children && node.children.length) {
					addToLookup(node.children);
				}
			}
		};

		addToLookup(this.layerTree);
		return lookup;
	});

	/**
	 * Initializes the layer tree from a WebMap
	 * @param webMap - The WebMap to build the tree from
	 * @param treeviewConfig - Optional configuration to filter layers
	 */
	public async initializeFromWebMap(
		webMap: __esri.WebMap | null,
		treeviewConfig?: TreeviewConfig | null
	): Promise<void> {
		if (!webMap) {
			this.layerTree = [];
			this.visibleNode = null;
			return;
		}

		await webMap.when();
		const tree = await this.buildTreeFromMap(webMap, treeviewConfig);
		this.layerTree = tree;
		this.initializeVisibility(tree);
	}

	/**
	 * Builds a tree structure from the WebMap layers
	 * @param map - The WebMap to build from
	 * @param treeviewConfig - Optional configuration to filter layers
	 * @returns Promise resolving to the tree structure
	 */
	private async buildTreeFromMap(
		map: __esri.Map,
		treeviewConfig?: TreeviewConfig | null
	): Promise<TreeNode[]> {
		const nodes: TreeNode[] = [];
		for (const layer of map.layers.toArray()) {
			nodes.push(await this.layerToNode(layer));
		}

		const filteredNodes = treeviewConfig
			? nodes.filter((node) => treeviewConfig.layers.some((config) => config.name === node.name))
			: nodes;

		return this.reverseNodes(filteredNodes);
	}

	/**
	 * Reverses the order of nodes and their children recursively
	 * @param nodes - Nodes to reverse
	 * @returns The reversed nodes array
	 */
	private reverseNodes(nodes: TreeNode[]): TreeNode[] {
		nodes.reverse();
		for (const node of nodes) {
			if (node.children && node.children.length) {
				this.reverseNodes(node.children);
			}
		}
		return nodes;
	}

	/**
	 * Converts a layer to a TreeNode structure
	 * @param layer - The layer to convert
	 * @returns Promise resolving to the TreeNode
	 */
	private async layerToNode(layer: __esri.Layer): Promise<TreeNode> {
		const base: TreeNode = {
			id: layer.uid,
			name: layer.title as string,
			layer: layer,
			children: []
		};

		if (layer.type === 'group') {
			const g = layer as __esri.GroupLayer;
			base.children = await Promise.all(g.layers.toArray().map((c) => this.layerToNode(c)));
			return base;
		}

		// MapImageLayer / WMSLayer -> dive into .sublayers (which can be nested)
		if (layer.type === 'map-image' || layer.type === 'wms') {
			const layerWithSublayers = layer as __esri.MapImageLayer | __esri.WMSLayer;
			const hasSublayers = layerWithSublayers.sublayers && layerWithSublayers.sublayers.length > 0;
			if (hasSublayers) {
				base.children = await this.sublayerCollectionToNodes(
					layerWithSublayers.sublayers as __esri.Collection<__esri.Sublayer>
				);
			}
			return base;
		}

		return base;
	}

	/**
	 * Converts a collection of sublayers to TreeNode array
	 * @param sublayers - Collection of sublayers to convert
	 * @returns Promise resolving to TreeNode array
	 */
	private async sublayerCollectionToNodes(
		sublayers: __esri.Collection<__esri.Sublayer>
	): Promise<TreeNode[]> {
		const nodes: TreeNode[] = [];
		for (const subLayer of sublayers.toArray()) {
			nodes.push(await this.sublayerToNode(subLayer));
		}
		return nodes;
	}

	/**
	 * Converts a sublayer to a TreeNode structure
	 * @param subLayer - The sublayer to convert
	 * @returns Promise resolving to the TreeNode
	 */
	private async sublayerToNode(subLayer: __esri.Sublayer): Promise<TreeNode> {
		const node: TreeNode = {
			id: subLayer.uid,
			name: subLayer.title as string,
			layer: subLayer,
			children: []
		};

		if (subLayer.sublayers && subLayer.sublayers.length) {
			node.children = await this.sublayerCollectionToNodes(subLayer.sublayers);
		}
		return node;
	}

	/**
	 * Initializes visibility for all nodes, setting them to invisible by default
	 * @param nodes - Tree nodes to initialize visibility for
	 */
	private initializeVisibility(nodes: TreeNode[]): void {
		this.visibleNode = null;

		const setNodeInvisible = (nodeList: TreeNode[]) => {
			for (const node of nodeList) {
				node.layer.visible = false;
				if (node.children && node.children.length) {
					setNodeInvisible(node.children);
				}
			}
		};

		setNodeInvisible(nodes);
	}

	/**
	 * Handles toggling visibility of a tree node, ensuring only one layer is visible at a time
	 * @param node - The node to toggle visibility for
	 * @param visible - Whether the node should be visible
	 */
	handleNodeVisibleToggle(node: TreeNode, visible: boolean) {
		if (!node || !node.layer || !('visible' in node.layer)) {
			return;
		}

		// If turning off visibility, clear the visible node
		if (!visible) {
			if (this.visibleNode === node) {
				node.layer.visible = false;
				this.visibleNode = null;
				this.updateParentVisibility(node);
			}
			return;
		}

		// If turning on visibility, first clear the current visible node
		if (this.visibleNode) {
			this.visibleNode.layer.visible = false;
			this.updateParentVisibility(this.visibleNode);
		}

		// Then set the new visible node
		this.visibleNode = node;
		node.layer.visible = true;

		// Ensure parent layers are visible so the selected layer can be seen
		this.activateParentLayers(node);

		if (!node?.layer?.title) {
			return;
		}

		toast.success(`'${node.layer.title}' Selected`);
	}

	/**
	 * Activates parent layers so the selected child layer can be visible
	 * @param node - The node whose parents should be activated
	 */
	private activateParentLayers(node: TreeNode): void {
		const parentLayer = node.layer.parent as __esri.GroupLayer;
		if (parentLayer && parentLayer.type === 'group') {
			parentLayer.visible = true;

			// Recursively activate parent layers up the chain
			const parentNode = this.findNodeByLayerId(parentLayer.uid);
			if (parentNode) {
				this.activateParentLayers(parentNode);
			}
		}
	} /**
	 * Updates parent layer visibility based on child visibility
	 * @param node - The node whose parent visibility should be updated
	 */
	private updateParentVisibility(node: TreeNode): void {
		const parentLayer = node.layer.parent as __esri.GroupLayer;
		if (parentLayer && parentLayer.type === 'group') {
			const hasVisibleChildren = parentLayer.layers.some((layer) => layer.visible);
			parentLayer.visible = hasVisibleChildren;

			// Recursively update parent visibility up the chain
			const parentNode = this.findNodeByLayerId(parentLayer.uid);
			if (parentNode) {
				this.updateParentVisibility(parentNode);
			}
		}
	} /**
	 * Finds a tree node by its layer ID
	 * @param layerId - The layer ID to search for
	 * @returns The matching tree node or undefined if not found
	 */
	private findNodeByLayerId(layerId: string): TreeNode | undefined {
		const findInNodes = (nodes: TreeNode[]): TreeNode | undefined => {
			for (const node of nodes) {
				if (node.layer.uid === layerId) {
					return node;
				}
				if (node.children && node.children.length) {
					const found = findInNodes(node.children);
					if (found) {
						return found;
					}
				}
			}
			return undefined;
		};

		return findInNodes(this.layerTree);
	}

	/**
	 * Gets the visibility state of a specific node
	 * @param nodeId - The ID of the node to check
	 * @returns The visibility state
	 */
	public getNodeVisibility(nodeId: string): boolean {
		return this.visibleNode?.id === nodeId;
	}

	/**
	 * Clears all state (useful for cleanup)
	 */
	public clear(): void {
		this.layerTree = [];
		this.visibleNode = null;
	}
}

/**
 * Singleton instance of the area selection tree view store
 */
export const areaSelectionTreeviewStore = new AreaSelectionTreeviewStore();
