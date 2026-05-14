<script lang="ts">
	import type { LTreeNode } from '@keenmate/svelte-treeview';
	import BaseTreeview, { type FlatTreeNode } from '$lib/Components/Treeview/BaseTreeview.svelte';
	import DownloadButton from '$lib/Components/Treeview/Data/DownloadButton.svelte';
	import InfoButton from '$lib/Components/Treeview/Data/InfoButton.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon.js';
	import TreeviewNodeCard from '$lib/Components/Treeview/TreeviewNodeCard.svelte';
	import TreeviewVisibilityAction from '$lib/Components/Treeview/TreeviewVisibilityAction.svelte';
	import { flattenDataNodes } from '$lib/Components/Treeview/treeviewFlattening';
	import { setTreeEvents } from '$lib/Events/DataTreeviewEvents.js';
	import { SelectionState, type TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeTagProvider } from '$lib/Services/INodeTagProvider';
	import type { ITagDefinitionProvider } from '$lib/Services/ITagDefinitionProvider';
	import { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';
	import { TreeviewNodeTypology } from '$lib/Types/Treeview.types.js';

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

		/** Search text for filtering the tree (bindable). */
		searchText?: string;

		/** Number of selected datasets to display in the toolbar. */
		selectionCount?: number;
	};

	type DataTreeNode = LTreeNode<FlatTreeNode>;

	let {
		treeviewStore,
		nodeConfigProvider,
		nodeTagProvider,
		tagDefinitionProvider,
		selectedTagIds,
		searchText = $bindable(''),
		selectionCount = 0
	}: Props = $props();

	$effect(() => {
		// Kept as part of the public component API for callers that provide full treeview services.
		void tagDefinitionProvider;
	});

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatTreeNode[]>([]);

	/** Rebuild flat data whenever tree nodes or tag filters change. */
	$effect(() => {
		const nodes = treeviewStore.getNodes();
		const tags = selectedTagIds;
		flatData = flattenDataNodes(nodes, tags, nodeConfigProvider, nodeTagProvider);
	});

	function onDownloadStateChanged(node: TreeviewNode, downloadState: SelectionState): void {
		treeviewStore.setSelectionState(node, downloadState);
	}

	function getDownloadState(node: TreeviewNode): SelectionState {
		return treeviewStore.getSelectionState(node);
	}

	/**
	 * Determine whether the visibility checkbox should be shown for a node.
	 * Folders only show visibility when they are checked/visible.
	 * Leaf nodes always show visibility.
	 */
	function shouldShowVisibility(hasChildren: boolean, isVisible: boolean): boolean {
		if (hasChildren && !isVisible) return false;
		return true;
	}

	setTreeEvents({
		onNodeVisibilityChange: (node, visible) => treeviewStore.setVisibilityState(node.id, visible),
		onDownloadStateChanged,
		getDownloadState,
		getNodeVisibility: (nodeId: string) => treeviewStore.getVisibilityState(nodeId),
		getNodeDrawState: (nodeId: string) => treeviewStore.getNodeDrawState(nodeId)
	});
</script>

<BaseTreeview
	data={flatData}
	bind:searchText
	searchBar={{ enabled: true, placeholder: 'Search data...', collapsible: true }}
	virtualScroll={{ enabled: true }}
>
	{#snippet toolbarEnd()}
		<p class="ml-auto shrink-0 text-xs text-muted-foreground leading-none pr-2 pb-0.5">
			{selectionCount} dataset(s) selected
		</p>
	{/snippet}

	{#snippet nodeContent(treeNode: DataTreeNode)}
		{@const nodeRef = treeNode.data!.nodeRef}
		{@const config = nodeConfigProvider.getConfig(nodeRef.id)}
		{@const isDownloadable = config?.isEnabled ?? true}
		{@const hasChildren = treeNode.hasChildren}
		{@const isVisible = treeviewStore.getVisibilityState(nodeRef.id)}
		{@const drawState = treeviewStore.getNodeDrawState(nodeRef.id)}
		{@const showVisibility = shouldShowVisibility(hasChildren, isVisible)}
		{@const icon = getNodeIcon(
			config?.typology ?? TreeviewNodeTypology.Variable,
			treeNode.isExpanded
		)}

		<TreeviewNodeCard
			{hasChildren}
			isOpen={treeNode.isExpanded}
			{icon}
			name={nodeRef.name}
			stopActionClickPropagation
		>
			{#snippet actions()}
				{#if config?.metadataTabInfoUrl}
					<span class="action-slot">
						<InfoButton layerId={nodeRef.id} />
					</span>
				{/if}

				{#if isDownloadable}
					<span class="action-slot">
						<DownloadButton node={nodeRef} {onDownloadStateChanged} {getDownloadState} />
					</span>
				{/if}

				{#if showVisibility}
					<TreeviewVisibilityAction
						checked={isVisible}
						{drawState}
						onCheckedChange={() => treeviewStore.setVisibilityState(nodeRef.id, !isVisible)}
					/>
				{/if}
			{/snippet}
		</TreeviewNodeCard>
	{/snippet}
</BaseTreeview>
