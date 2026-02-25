import type { TreeviewNode } from '$lib/Models/Treeview/Index';

/**
 * Interface for providing treeview nodes.
 */
export interface INodeProvider {
	/** Gets all treeview nodes available in the treeview. */
	getAllTreeviewNodes(): TreeviewNode[];

	/**
	 * Gets the treeview node for a given node ID.
	 * @param nodeId The node ID to receive its treeview node for.
	 */
	getTreeviewNode(nodeId: string): TreeviewNode | undefined;
}
