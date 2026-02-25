import { DatasetTreeviewNode } from '$lib/Models/Treeview/DatasetTreeviewNode';
import type { LayerType } from '$lib/Models/Treeview/LayerType';
import type { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { VariableSubType } from '$lib/Models/Treeview/VariableSubType';

/**
 * Treeview node that represents a variable within a layer.
 * Extends DatasetTreeviewNode with variable-specific properties.
 */
export class VariableTreeviewNode extends DatasetTreeviewNode {
	/** The type of the node */
	public readonly type: TreeviewNodeType = TreeviewNodeType.Variable;

	/** The subtype of the variable (e.g., field or tile). */
	public readonly variableSubType: VariableSubType;

	/** The associated variable ID. */
	public readonly variableId: string;

	/**
	 * Initializes a new instance of the VariableTreeviewNode class.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param layerId - The layer ID.
	 * @param layerType - The layer type.
	 * @param variableSubType - The variable subtype.
	 * @param variableId - The variable ID.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		layerId: string,
		layerType: LayerType,
		variableSubType: VariableSubType,
		variableId: string,
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null
	) {
		super(id, name, layerId, layerType, children, parent);
		this.variableSubType = variableSubType;
		this.variableId = variableId;
	}
}
