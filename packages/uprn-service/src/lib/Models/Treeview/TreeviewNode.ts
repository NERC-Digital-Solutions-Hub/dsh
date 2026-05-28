import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { TreeviewNodeCapabilities } from '$lib/Models/Treeview/TreeviewNodeCapabilities';

/**
 * Base class representing a node in the treeview.
 * Provides common properties and structure for all tree nodes.
 */
export class TreeviewNode {
	/** The type of the node, used for distinguishing between different node classes. */
	public readonly type: TreeviewNodeType = TreeviewNodeType.Folder;

	/** Unique identifier for the node. */
	public readonly id: string;

	/** Display name of the node. */
	public readonly name: string;

	/** Child nodes under this node. */
	public readonly children: TreeviewNode[];

	/** Parent node, if any. */
	public readonly parent: TreeviewNode | null;

	/** Renderer-neutral domain capabilities for this node. */
	public readonly capabilities: TreeviewNodeCapabilities;

	/**
	 * Initializes a new instance of the TreeviewNode class.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(
		id: string,
		name: string,
		children: TreeviewNode[] = [],
		parent: TreeviewNode | null = null,
		capabilities: TreeviewNodeCapabilities = {}
	) {
		this.id = id;
		this.name = name;
		this.children = children;
		this.parent = parent;
		this.capabilities = capabilities;
	}
}
