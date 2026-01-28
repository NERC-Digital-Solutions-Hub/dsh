import { TreeLayerNode } from '$lib/models/treeview/tree-layer-node';
import type { TreeNode } from '$lib/models/treeview/tree-node';

/**
 * Tree node that represents a field within a feature layer.
 * Extends TreeLayerNode with field-specific properties.
 */
export class TreeFieldNode extends TreeLayerNode {
	/** The associated feature layer. */
	featureLayer: __esri.FeatureLayer;
	/** The associated field. */
	field: __esri.Field;

	/**
	 * Creates a new TreeFieldNode.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param layer - The ESRI feature layer.
	 * @param field - The field.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		layer: __esri.FeatureLayer,
		field: __esri.Field,
		children: TreeNode[] = [],
		parent: TreeNode | null = null
	) {
		super(id, name, layer, children, parent);
		this.field = field;
		this.featureLayer = layer;
	}
}
