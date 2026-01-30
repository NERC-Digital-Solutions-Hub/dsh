/**
 * Base class representing a node in the tree view.
 * Provides common properties and structure for all tree nodes.
 */
export class TreeNode {
	/** Unique identifier for the node. */
	public id: string;
	/** Display name of the node. */
	public name: string;
	/** Child nodes under this node. */
	public children: TreeNode[];
	/** Parent node, if any. */
	public parent: TreeNode | null;

	/**
	 * Creates a new TreeNode.
	 * @param id - Unique identifier.
	 * @param name - Display name.
	 * @param children - Initial child nodes.
	 * @param parent - Parent node.
	 */
	constructor(id: string, name: string, children: TreeNode[] = [], parent: TreeNode | null = null) {
		this.id = id;
		this.name = name;
		this.children = children;
		this.parent = parent;
	}
}
