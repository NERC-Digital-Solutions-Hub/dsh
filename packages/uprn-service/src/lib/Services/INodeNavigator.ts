/**
 * Interface for navigating to treeview nodes by ID.
 */
export interface INodeNavigator {
	/**
	 * Navigates to the treeview node specified by the given ID.
	 * @param nodeId The ID of the node to navigate to.
	 */
	navigateToNode(nodeId: string): void;
}
