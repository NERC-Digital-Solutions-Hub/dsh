<script lang="ts">
	import * as TreeView from '$lib/Components/shadcn/tree-view/index.js';
	import Node from '$lib/Components/Treeview/Data/Node.svelte';
	import { setTreeEvents } from '$lib/Events/DataTreeviewEvents.js';
	import { NodeDrawState, SelectionState, type TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeTagProvider } from '$lib/Services/INodeTagProvider';
	import type { ITagDefinitionProvider } from '$lib/Services/ITagDefinitionProvider';
	import { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';

	/** Props for the TreeView component. */
	type Props = {
		/** The tree view store instance. */
		treeviewStore: TreeviewStore;

		/** Configuration store for tree view settings. */
		nodeConfigProvider: INodeConfigProvider;

		/** Provider for node tags. */
		nodeTagProvider: INodeTagProvider;

		/** Provider for tag definitions. */
		tagDefinitionProvider: ITagDefinitionProvider;

		/** The IDs of currently selected tags to filter by. */
		selectedTagIds: Set<string>;
	};

	const {
		treeviewStore,
		nodeConfigProvider,
		nodeTagProvider,
		tagDefinitionProvider,
		selectedTagIds
	}: Props = $props();

	/**
	 * Filtered nodes based on selected tag IDs.
	 * When no tags are selected, all nodes are shown.
	 */
	const filteredNodes = $derived.by(() => {
		const allNodes = treeviewStore.getNodes();
		if (selectedTagIds.size === 0) {
			return allNodes;
		}
		return allNodes.filter((node) => nodeMatchesTagFilter(node));
	});

	function onNodeVisibilityChange(node: TreeviewNode, visible: boolean): void {
		treeviewStore.setVisibilityState(node.id, visible);
	}

	function getNodeDrawState(nodeId: string): NodeDrawState {
		return treeviewStore.getNodeDrawState(nodeId);
	}

	/**
	 * Handles download state changes for a node.
	 * Adds or removes the node from the data selection store.
	 * @param node - The node to update download state for
	 * @param downloadState - The new download state of the node.
	 */
	function onDownloadStateChanged(node: TreeviewNode, downloadState: SelectionState): void {
		treeviewStore.setSelectionState(node, downloadState);
	}

	/**
	 * Gets the current download state for a node.
	 * @param node - The node to check download state for
	 * @returns The download state of the node
	 */
	function getDownloadState(node: TreeviewNode): SelectionState {
		return treeviewStore.getSelectionState(node);
	}

	/**
	 * Checks if a node or any of its descendants match the selected tag filters.
	 * @param node - The node to check.
	 * @returns True if the node or any descendant matches the filter criteria.
	 */
	function nodeMatchesTagFilter(node: TreeviewNode): boolean {
		// If no tags are selected, show all nodes
		if (selectedTagIds.size === 0) {
			return true;
		}

		// Check if this node has any of the selected tags
		const nodeTags = nodeTagProvider.getTags(node.id);
		const hasMatchingTag = nodeTags.some((tagId) => selectedTagIds.has(tagId));
		if (hasMatchingTag) {
			return true;
		}

		// Check if any child matches the filter (for folder nodes)
		if (node.children?.length) {
			return node.children.some((child) => nodeMatchesTagFilter(child));
		}

		return false;
	}

	setTreeEvents({
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		getNodeVisibility: (nodeId: string) => treeviewStore.getVisibilityState(nodeId),
		getNodeDrawState
	});
</script>

<TreeView.Root>
	{#each filteredNodes as node (node.id)}
		<Node
			{node}
			depth={0}
			{nodeConfigProvider}
			{nodeTagProvider}
			{tagDefinitionProvider}
			{selectedTagIds}
		/>
	{/each}
</TreeView.Root>
