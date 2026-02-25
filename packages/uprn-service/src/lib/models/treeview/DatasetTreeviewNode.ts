import type { LayerType } from '$lib/Models/Treeview/LayerType';
import { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';

/**
 * Tree node that represents a dataset in the treeview.
 * Extends TreeviewNode with layer-specific properties.
 */
export class DatasetTreeviewNode extends TreeviewNode {
	/** The type of the node */
	public readonly type: TreeviewNodeType = TreeviewNodeType.Dataset;

	/** The associated layer ID. */
	public readonly layerId: string;

	/** The type of the layer. */
	public readonly layerType: LayerType;

	/**
	 * Initializes a new instance of the DatasetTreeviewNode class.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param layerId - The layer ID.
	 * @param layerType - The layer type.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		layerId: string,
		layerType: LayerType,
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null
	) {
		super(id, name, children, parent);
		this.layerId = layerId;
		this.layerType = layerType;
	}
}
