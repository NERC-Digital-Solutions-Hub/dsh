import type { TreeNode } from '$lib/components/common/services/uprn2/tree-view/types';
import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';

/**
 * Abstract class for converting map layers to tree nodes.
 */
export abstract class CustomNodeConverter {

    /**
     * Configuration store for tree view node configurations..
     */
	protected configStore: TreeviewConfigStore;

	/**
	 * Initializes the CustomNodeConverter with a configuration store.
	 * @param configStore - The configuration store to use
	 */
	constructor(configStore: TreeviewConfigStore) {
		this.configStore = configStore;
	}

	/**
	 * Converts a map layer to a tree node, handling different layer types.
	 * Recursively processes group layers and sublayers.
	 * @param layer - The layer to convert
	 * @param parent - The parent node, if any
	 * @returns The created tree node
	 */
	abstract layerToNode(
		layer: __esri.Layer,
		parent: TreeNode | null
	): TreeNode;
}
