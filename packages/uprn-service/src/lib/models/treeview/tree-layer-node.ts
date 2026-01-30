import { TreeNode } from '$lib/models/treeview/tree-node';

/**
 * Tree node that represents an ESRI layer or sublayer.
 * Extends TreeNode with layer-specific properties.
 */
export class TreeLayerNode extends TreeNode {
	/** The associated ESRI layer or sublayer. */
	public layer: __esri.Layer | __esri.Sublayer;

	/**
	 * Creates a new TreeLayerNode.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param layer - The ESRI layer.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		layer: __esri.Layer | __esri.Sublayer,
		children: TreeNode[] = [],
		parent: TreeNode | null = null
	) {
		super(id, name, children, parent);
		this.layer = layer;
	}
}
