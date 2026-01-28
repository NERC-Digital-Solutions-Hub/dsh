/**
 * Base class representing a node in the tree view.
 * Provides common properties and structure for all tree nodes.
 */
export class TreeNode {
	/** Unique identifier for the node. */
	id: string;
	/** Display name of the node. */
	name: string;
	/** Child nodes under this node. */
	children: TreeNode[];
	/** Parent node, if any. */
	parent: TreeNode | null;

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