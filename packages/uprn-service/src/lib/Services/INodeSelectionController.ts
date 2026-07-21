import type { SelectionState, TreeviewNode } from '$lib/Models/Treeview/index';

/**
 * Interface for controlling the selection associated with treeview nodes.
 */
export interface INodeSelectionController {
	/**
	 * Gets the current selection state of a given treeview node.
	 * @param node The treeview node to get the selection state for.
	 * @returns The current selection state of the node, or undefined if not tracked.
	 */
	getSelectionState(node: TreeviewNode): SelectionState;

	/**
	 * Updates the selection state of a given treeview node.
	 * @param node The treeview node to update the selection state for.
	 * @param state The SelectionState to set for the node.
	 */
	setSelectionState(node: TreeviewNode, state: SelectionState): void;

	/** Resets all tracked selection states and their associated handles. */
	reset(): void;
}
