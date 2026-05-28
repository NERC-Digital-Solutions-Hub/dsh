import type { StyleBinding, TreeviewNode } from '$lib/Models/Treeview/Index';

export type NodeStyleChange = {
	sourceNode: TreeviewNode;
	style: StyleBinding;
};

/**
 * Renderer-neutral bridge for applying node-driven styling to a render source.
 */
export interface INodeStyleRenderer {
	applyStyle(change: NodeStyleChange): void | Promise<void>;
}
