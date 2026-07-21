import type { NodeDrawState, TreeviewNode } from '$lib/Models/Treeview/index';
import type { INodeVisibilityRenderer } from '$lib/Services/INodeVisibilityRenderer';

/**
 * Interface for controlling the visibility associated with treeview nodes.
 */
export interface INodeVisibilityController {
	/** Tracks the draw state of each node by its ID. Draw state is used to determine HOW the node is visible. */
	drawStates: Map<string, NodeDrawState>;

	/** Tracks the visibility state of each node by its ID. Visibility state is used to determine IF the node is visible. */
	visibilityStates: Map<string, boolean>;

	/**
	 * Gets the current draw state of a given treeview node.
	 * @param node The treeview node to get the draw state for.
	 * @returns The current draw state of the node, or undefined if not tracked.
	 */
	getDrawState(node: TreeviewNode): NodeDrawState | undefined;

	/**
	 * Gets the current visibility state of a given treeview node.
	 * @param node The treeview node to get the visibility state for.
	 * @returns The current visibility state of the node, or undefined if not tracked.
	 */
	getVisibilityState(node: TreeviewNode): boolean;

	/**
	 * Updates the visibility state of a given treeview node.
	 * @param node The treeview node to update the draw state for.
	 * @param isVisible A boolean indicating whether the node is currently visible.
	 */
	setVisibilityState(node: TreeviewNode, isVisible: boolean): void;

	/**
	 * Sets the renderer bridge used to apply visibility state outside the tree.
	 * @param renderer The renderer bridge to use.
	 */
	setVisibilityRenderer(renderer: INodeVisibilityRenderer): void;

	/** Resets and detaches the renderer bridge without clearing tracked visibility state. */
	clearVisibilityRenderer(): void;

	/** Resets all tracked draw states and renderer state. */
	reset(): void;
}
