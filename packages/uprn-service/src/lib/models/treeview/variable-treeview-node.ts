import { LayerTreeviewNode } from '$lib/models/treeview/layer-treeview-node';
import type { TreeviewNode } from '$lib/models/treeview/treeview-node';

/**
 * Treeview node that represents a variable within a layer.
 * Extends LayerTreeviewNode with field-specific properties.
 */
export class VariableTreeviewNode extends LayerTreeviewNode {
	/** The associated feature layer. */
	public featureLayer: __esri.FeatureLayer;

	/** The associated field. */
	public field: __esri.Field;

	/**
	 * Initializes a new instance of the VariableTreeviewNode class.
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
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null
	) {
		super(id, name, layer, children, parent);
		this.field = field;
		this.featureLayer = layer;
	}
}
