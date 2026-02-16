/**
 * Base class representing a node in the treeview.
 * Provides common properties and structure for all tree nodes.
 */
export class TreeviewNode {
	/** Unique identifier for the node. */
	public id: string;

	/** Display name of the node. */
	public name: string;

	/** Child nodes under this node. */
	public children: TreeviewNode[];

	/** Parent node, if any. */
	public parent: TreeviewNode | null;

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
		parent: TreeviewNode | null = null
	) {
		this.id = id;
		this.name = name;
		this.children = children;
		this.parent = parent;
	}
}
