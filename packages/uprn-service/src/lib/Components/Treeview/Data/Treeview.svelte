<script lang="ts">
	import type { LTreeNode } from '@keenmate/svelte-treeview';
	import BaseTreeview, { type FlatTreeNode } from '$lib/Components/Treeview/BaseTreeview.svelte';
	import OpenIndicator from '$lib/Components/OpenIndicator/OpenIndicator.svelte';
	import DownloadButton from '$lib/Components/Treeview/Data/DownloadButton.svelte';
	import InfoButton from '$lib/Components/Treeview/Data/InfoButton.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon.js';
	import { setTreeEvents } from '$lib/Events/DataTreeviewEvents.js';
	import VisibilityCheckbox from '$lib/Components/VisibilityCheckbox/VisibilityCheckbox.svelte';
	import { NodeDrawState, SelectionState, type TreeviewNode } from '$lib/Models/Treeview/Index.js';
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

	let {
		treeviewStore,
		nodeConfigProvider,
		nodeTagProvider,
		tagDefinitionProvider,
		selectedTagIds,
		searchText = $bindable(''),
		selectionCount = 0
	}: Props = $props();

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatTreeNode[]>([]);

	/** Rebuild flat data whenever tree nodes or tag filters change. */
	$effect(() => {
		const nodes = treeviewStore.getNodes();
		const tags = selectedTagIds;
		flatData = flattenDataNodes(nodes, tags);
	});

	/**
	 * Flatten the hierarchical tree into a flat array with dot-separated paths.
	 * Applies tag filtering at all levels and excludes hidden nodes.
	 */
	function flattenDataNodes(nodes: TreeviewNode[], activeTags: Set<string>): FlatTreeNode[] {
		const result: FlatTreeNode[] = [];

		function walk(nodes: TreeviewNode[], parentPath: string) {
			const visible: {
				node: TreeviewNode;
				config: ReturnType<typeof nodeConfigProvider.getConfig>;
			}[] = [];

			for (const node of nodes) {
				const config = nodeConfigProvider.getConfig(node.id);
				if (config?.isHidden) continue;
				if (activeTags.size > 0 && !nodeMatchesTagFilter(node)) continue;
				visible.push({ node, config });
			}

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

	/**
	 * Checks if a node or any of its descendants match the selected tag filters.
	 */
	function nodeMatchesTagFilter(node: TreeviewNode): boolean {
		if (selectedTagIds.size === 0) return true;

		const nodeTags = nodeTagProvider.getTags(node.id);
		if (nodeTags.some((tagId) => selectedTagIds.has(tagId))) return true;

		if (node.children?.length) {
			return node.children.some((child) => nodeMatchesTagFilter(child));
		}

		return false;
	}

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
		<p class="ml-auto shrink-0 text-xs text-muted-foreground leading-none pr-0.5 pb-0.5">
			{selectionCount} dataset(s) selected
		</p>
	{/snippet}

	{#snippet nodeContent(treeNode: LTreeNode)}
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

		<div class="node-card relative overflow-hidden rounded-md">
			<div class="node-grid">
				<div class="node-icons">
					{#if hasChildren}
						<span class="icon-slot">
							<OpenIndicator isOpen={treeNode.isExpanded} />
						</span>
					{/if}
					<span class="icon-slot">
						{#if typeof icon === 'string'}
							{@html icon}
						{:else}
							{@const Icon = icon}
							<Icon />
						{/if}
					</span>
				</div>

				<span class="node-name">{nodeRef.name}</span>

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="node-end" onclick={(e) => e.stopPropagation()}>
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
						<span class="action-slot visibility-wrapper visible">
							<span class="visibility-inner">
								<VisibilityCheckbox
									checked={isVisible}
									indeterminate={drawState === NodeDrawState.Suspended}
									onCheckedChange={() => treeviewStore.setVisibilityState(nodeRef.id, !isVisible)}
								/>
							</span>
							{#if drawState === NodeDrawState.Suspended}
								<span class="indeterminate-label">zoom</span>
							{/if}
						</span>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}
</BaseTreeview>
