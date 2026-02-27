import type { VisibilityGroupConfig } from '$lib/Types/Treeview.types';

/**
 * Interface for providing configurations associated with treeview nodes.
 */
export interface IVisibilityGroupProvider {
	/**
	 * Gets the visibility group configuration for a given node ID.
	 * @param nodeId The node ID to receive its visibility group configuration for.
	 */
	getVisibilityGroupConfig(nodeId: string): VisibilityGroupConfig | undefined;
}
