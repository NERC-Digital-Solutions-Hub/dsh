import type { TreeviewNodeConfig } from '$lib/types/treeview';

/**
 * Interface for providing configurations associated with treeview nodes.
 */
export interface INodeConfigProvider {
	/**
	 * Gets the configuration for a given node ID.
	 * @param nodeId The node ID to receive its configuration for.
	 */
	getConfig(nodeId: string): TreeviewNodeConfig | undefined;
}
