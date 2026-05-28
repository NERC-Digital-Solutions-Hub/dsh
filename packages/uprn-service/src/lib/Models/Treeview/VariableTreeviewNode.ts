import type { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
import { TreeviewNode as BaseTreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
import type { TreeviewNodeCapabilities } from '$lib/Models/Treeview/TreeviewNodeCapabilities';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';

/**
 * Treeview node that represents a variable within a layer.
 */
export class VariableTreeviewNode extends BaseTreeviewNode {
	/** The type of the node */
	public readonly type: TreeviewNodeType = TreeviewNodeType.Variable;

	/**
	 * Initializes a new instance of the VariableTreeviewNode class.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param capabilities - Renderer-neutral capabilities for this variable.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		capabilities: TreeviewNodeCapabilities = {},
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null
	) {
		super(id, name, children, parent, capabilities);
	}

	/** @deprecated Use capabilities.render/selection/style sourceId instead. */
	public get layerId(): string {
		return (
			this.capabilities.selection?.sourceId ??
			this.capabilities.render?.sourceId ??
			this.capabilities.style?.sourceId ??
			this.id
		);
	}

	/** @deprecated Use capabilities.selection/style fieldId or render memberId instead. */
	public get variableId(): string {
		const selection = this.capabilities.selection;
		if (selection?.kind === 'field') {
			return selection.fieldId;
		}

		if (this.capabilities.style) {
			return this.capabilities.style.fieldId;
		}

		const render = this.capabilities.render;
		if (render?.kind === 'source-member') {
			return render.memberId;
		}

		return this.id;
	}
}
