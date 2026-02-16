import { TreeviewNode } from '$lib/models/treeview/treeview-node';

/**
 * Tree node that represents an ESRI layer or sublayer.
 * Extends TreeviewNode with layer-specific properties.
 */
export class LayerTreeviewNode extends TreeviewNode {
	/** The associated ESRI layer or sublayer. */
	public layer: __esri.Layer | __esri.Sublayer;

	/**
	 * Initializes a new instance of the LayerTreeviewNode class.
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
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null
	) {
		super(id, name, children, parent);
		this.layer = layer;
	}
}
