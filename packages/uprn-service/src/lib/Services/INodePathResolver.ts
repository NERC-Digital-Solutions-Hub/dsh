/**
 * Interface for resolving treeview node paths and IDs.
 */
export interface INodePathResolver {
	/**
	 * Gets the path of the node with the given ID.
	 * @param nodeId - The ID of the node to get the path for.
	 * @returns - The path of the node, or undefined if not found.
	 */
	getNodePath(nodeId: string): string | undefined;

	/**
	 * Gets the ID of the node with the given path.
	 * @param nodePath - The path of the node to get the ID for.
	 * @return - The ID of the node, or undefined if not found.
	 */
	getNodeId(nodePath: string): string | undefined;
}
