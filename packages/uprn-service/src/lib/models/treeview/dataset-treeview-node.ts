import { TreeviewNode } from '$lib/models/treeview/treeview-node';
import type { TreeviewNodeCapabilities } from '$lib/models/treeview/treeview-node-capabilities';
import { TreeviewNodeType } from '$lib/models/treeview/treeview-node-type';

/**
 * Tree node that represents a dataset in the treeview.
 * Extends TreeviewNode with layer-specific properties.
 */
export class DatasetTreeviewNode extends TreeviewNode {
	/** The type of the node */
	public readonly type: TreeviewNodeType = TreeviewNodeType.Dataset;

	/**
	 * Initializes a new instance of the DatasetTreeviewNode class.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param capabilities - Renderer-neutral capabilities for this dataset.
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

	/** @deprecated Use capabilities.render/selection sourceId instead. */
	public get layerId(): string {
		return this.capabilities.render?.sourceId ?? this.capabilities.selection?.sourceId ?? this.id;
	}
}
