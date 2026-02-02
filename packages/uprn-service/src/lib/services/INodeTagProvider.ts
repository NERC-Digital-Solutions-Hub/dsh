/**
 * Interface for providing tags associated with treeview nodes.
 */
export interface INodeTagProvider {
	/**
	 * Gets the tags for a given node ID.
	 * @param nodeId The node ID to receive tags for.
	 */
	getTags(nodeId: string): string[];
}
