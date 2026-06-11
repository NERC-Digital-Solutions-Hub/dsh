import {
	DatasetTreeviewNode,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { NodeVisibilityRenderTarget } from '$lib/Services/INodeVisibilityRenderer';

/**
 * Resolves a node to the renderer-neutral target that should be toggled for its visibility state.
 */
export function getNodeVisibilityRenderTarget(
	node: TreeviewNode
): NodeVisibilityRenderTarget | null {
	const render = node.capabilities.render;
	if (render?.kind === 'source') {
		return {
			kind: 'source',
			nodeId: node.id,
			sourceId: render.sourceId,
			drawStateNodeId: render.drawStateNodeId ?? node.id
		};
	}

	if (render?.kind === 'source-member') {
		return {
			kind: 'source-member',
			nodeId: node.id,
			sourceId: render.sourceId,
			memberId: render.memberId,
			drawStateNodeId: render.drawStateNodeId ?? node.id
		};
	}

	if (isDatasetNode(node) || isVariableNode(node)) {
		console.warn(`Render target not found for node ${node.id}`);
	}

	return null;
}

/**
 * Resolves state links that should follow a variable node visibility toggle.
 */
export function getLinkedVisibilityNodes(node: TreeviewNode): TreeviewNode[] {
	if (
		!isVariableNode(node) ||
		node.capabilities.selection?.kind !== 'field' ||
		node.capabilities.render?.kind !== 'source'
	) {
		return [];
	}

	const datasetNode = getDatasetNodeForVariable(node);
	if (!datasetNode) {
		console.warn(`Dataset node not found for variable node ${node.id}`);
		return [];
	}

	return [datasetNode];
}

export function getDatasetNodeForVariable(node: VariableTreeviewNode): DatasetTreeviewNode | null {
	const sourceId = node.capabilities.selection?.sourceId ?? node.capabilities.render?.sourceId;
	let currentNode: TreeviewNode | null = node;
	while (currentNode.parent) {
		if (
			isDatasetNode(currentNode.parent) &&
			(!sourceId ||
				currentNode.parent.capabilities.render?.sourceId === sourceId ||
				currentNode.parent.capabilities.selection?.sourceId === sourceId)
		) {
			return currentNode.parent;
		}

		currentNode = currentNode.parent;
	}

	return null;
}

function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
	return node.type === TreeviewNodeType.Dataset;
}

function isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
	return node.type === TreeviewNodeType.Variable;
}
