import { TreeviewNode } from '$lib/Models/Treeview/Index';
import type { INodeProvider } from '$lib/Services/INodeProvider';

/**
 * Provider for treeview nodes.
 */
export class NodeProvider implements INodeProvider {
	readonly #rootNodes: TreeviewNode[];
	readonly #nodeMap: Map<string, TreeviewNode> = new Map<string, TreeviewNode>();

	/**
	 * Creates an instance of NodeProvider.
	 *
	 * @param rootNodes The root nodes of the treeview to build the node map from.
	 */
	constructor(rootNodes: TreeviewNode[]) {
		this.#rootNodes = rootNodes;
		this.buildNodeMap(rootNodes);
	}

	/** @inheritdoc */
	public getAllTreeviewNodes(): TreeviewNode[] {
		return this.#rootNodes;
	}

	/** @inheritdoc */
	public getTreeviewNode(nodeId: string): TreeviewNode | undefined {
		return this.#nodeMap.get(nodeId);
	}

	/** Recursively builds a map of node IDs to treeview nodes for quick lookup. */
	private buildNodeMap(nodes: TreeviewNode[]): void {
		for (const node of nodes) {
			this.#nodeMap.set(node.id, node);
			if (node.children && node.children.length > 0) {
				this.buildNodeMap(node.children);
			}
		}
	}
}
