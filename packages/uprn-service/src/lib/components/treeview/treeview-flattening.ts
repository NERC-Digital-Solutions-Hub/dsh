import type { FlatTreeNode, GuideType } from '$lib/components/treeview/base-treeview.svelte';
import { DatasetTreeviewNode, type TreeviewNode } from '$lib/models/treeview/index.js';
import { TreeviewNodeType } from '$lib/models/treeview/treeview-node-type';
import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';

/**
 * Flattens area nodes for the virtualized Treeview.
 *
 * Area tree rules:
 * - root nodes include all non-hidden nodes;
 * - child nodes include only datasets;
 * - guide-line metadata is preserved for BaseTreeview indentation guides.
 */
export function flattenAreaNodes(
	nodes: TreeviewNode[],
	nodeConfigProvider: INodeConfigProvider
): FlatTreeNode[] {
	const result: FlatTreeNode[] = [];

	function walk(
		nodes: TreeviewNode[],
		parentPath: string,
		ancestorGuides: GuideType[],
		isRoot: boolean
	): void {
		const visible = nodes
			.map((node) => ({ node, config: nodeConfigProvider.getConfig(node.id) }))
			.filter(
				({ node, config }) =>
					!config?.isHidden && (isRoot || node.type === TreeviewNodeType.Dataset)
			);

		let index = 1;
		for (let visibleIndex = 0; visibleIndex < visible.length; visibleIndex++) {
			const { node, config } = visible[visibleIndex];
			const isLast = visibleIndex === visible.length - 1;
			const path = parentPath ? `${parentPath}.${index}` : `${index}`;
			const guideLines: GuideType[] = isRoot ? [] : [...ancestorGuides, isLast ? 'last' : 'full'];

			result.push({
				path,
				nodeId: node.id,
				name: node.name,
				order: index,
				nodeRef: node,
				isExpanded: config?.isOpenOnInit ?? false,
				guideLines
			});

			if (node.children?.length) {
				const childAncestorGuides = guideLines.map((guide) =>
					guide === 'last' ? (isLast ? 'last' : 'full') : guide
				) as GuideType[];
				walk(node.children, path, childAncestorGuides, false);
			}

			index++;
		}
	}

	walk(nodes, '', [], true);
	return result;
}

/**
 * Flattens data nodes for the virtualized Treeview, applying hidden-node filtering.
 */
export function flattenDataNodes(
	nodes: TreeviewNode[],
	nodeConfigProvider: INodeConfigProvider
): FlatTreeNode[] {
	const result: FlatTreeNode[] = [];

	function walk(nodes: TreeviewNode[], parentPath: string): void {
		const visible = nodes
			.map((node) => ({ node, config: nodeConfigProvider.getConfig(node.id) }))
			.filter(({ config }) => !config?.isHidden);

		let index = 1;
		for (const { node, config } of visible) {
			const path = parentPath ? `${parentPath}.${index}` : `${index}`;
			const indentLevel = path.split('.').length - 1;

			result.push({
				path,
				nodeId: node.id,
				name: node.name,
				order: index,
				nodeRef: node,
				isExpanded: config?.isOpenOnInit ?? false,
				guideLines: Array.from({ length: indentLevel }, () => 'full' as const)
			});

			if (node.children?.length) {
				walk(node.children, path);
			}

			index++;
		}
	}

	walk(nodes, '');
	return result;
}

export function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
	return node.type === TreeviewNodeType.Dataset;
}
