<script lang="ts">
	import * as TreeView from '$lib/Components/shadcn/tree-view/index.js';
	import { DatasetTreeviewNode, NodeDrawState, TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import type { IAreaSelectionController } from '$lib/Services/IAreaSelectionController';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';
	import Node from './Node.svelte';

	/**
	 * Props for the TreeView component.
	 */
	type Props = {
		/** Store for the treeview. */
		treeviewStore: TreeviewStore;

		/** Provider for treeview node configurations. */
		nodeConfigProvider: INodeConfigProvider;

		/** Controller for area selection management. */
		areaSelectionController: IAreaSelectionController;
	};

	const { treeviewStore, nodeConfigProvider, areaSelectionController }: Props = $props();

	/**
	 * Effect to update the area selection layer in the area selection store when the visible nodes in the area
	 * treeview change.
	 */
	$effect(() => {
		const visibleNodes = treeviewStore?.getVisibleNodes();
		if (!visibleNodes || visibleNodes.length === 0) {
			areaSelectionController.setAreaSelectionLayer(null);
			return;
		}

		const node: DatasetTreeviewNode | undefined = visibleNodes.find((n) => isDatasetNode(n)) as
			| DatasetTreeviewNode
			| undefined;
		if (!node) {
			return;
		}

		areaSelectionController.setAreaSelectionLayer(node.layerId);
	});

	/**
	 * Gets the draw state of a node by its ID.
	 * @param nodeId The ID of the node to check.
	 * @returns The draw state of the node.
	 */
	function getNodeDrawState(nodeId: string): NodeDrawState {
		return treeviewStore.getNodeDrawState(nodeId);
	}

	/**
	 * Checks if a given node is a DatasetTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
	 */
	function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}
</script>

<TreeView.Root>
	{#each treeviewStore.getNodes() as node (node.id)}
		<Node
			{nodeConfigProvider}
			{node}
			onNodeClick={() => {}}
			onNodeVisibilityChange={(node, visible) => treeviewStore.setVisibilityState(node.id, visible)}
			getNodeVisibility={(nodeId) => treeviewStore.getVisibilityState(nodeId)}
			{getNodeDrawState}
			depth={0}
			useLayerTypeIcon={true}
		/>
	{/each}
</TreeView.Root>
