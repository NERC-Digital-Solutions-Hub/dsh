<script lang="ts">
	import { Tree, type LTreeNode } from '@keenmate/svelte-treeview';
	import '@keenmate/svelte-treeview/styles.css';
	import { Input } from '$lib/Components/shadcn/input/index.js';
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
	import { Search, X } from '@lucide/svelte';

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

	/** Bindable search text for the KeenMate Tree's built-in FlexSearch. */
	let searchText = $state('');

	/** Flat data representation for the KeenMate Tree component. */
	interface FlatDataNode {
		path: string;
		nodeId: string;
		name: string;
		order: number;
		nodeRef: TreeviewNode;
		isExpanded: boolean;
	}

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatDataNode[]>([]);

	/** Rebuild flat data whenever tree nodes or tag filters change. */
	$effect(() => {
		const nodes = treeviewStore.getNodes();
		// Read selectedTagIds to establish reactive dependency
		const tags = selectedTagIds;
		flatData = flattenDataNodes(nodes, tags);
	});

	/**
	 * Flatten the hierarchical tree into a flat array with dot-separated paths.
	 * Applies tag filtering at all levels and excludes hidden nodes.
	 */
	function flattenDataNodes(nodes: TreeviewNode[], activeTags: Set<string>): FlatDataNode[] {
		const result: FlatDataNode[] = [];

		function walk(nodes: TreeviewNode[], parentPath: string) {
			let index = 1;
			for (const node of nodes) {
				const config = nodeConfigProvider.getConfig(node.id);
				if (config?.isHidden) continue;
				if (activeTags.size > 0 && !nodeMatchesTagFilter(node)) continue;

				const path = parentPath ? `${parentPath}.${index}` : `${index}`;
				result.push({
					path,
					nodeId: node.id,
					name: node.name,
					order: index,
					nodeRef: node,
					isExpanded: config?.isOpenOnInit ?? false
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

	function onNodeVisibilityChange(node: TreeviewNode, visible: boolean): void {
		treeviewStore.setVisibilityState(node.id, visible);
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

	/*
	 * Keep setTreeEvents so that any child components (e.g. InfoButton, DownloadButton)
	 * that may read from context continue to work.
	 */
	setTreeEvents({
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		getNodeVisibility: (nodeId: string) => treeviewStore.getVisibilityState(nodeId),
		getNodeDrawState: (nodeId: string) => treeviewStore.getNodeDrawState(nodeId)
	});
</script>

<div class="relative mb-2 w-full">
	<Search
		class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
	/>
	<Input
		type="text"
		placeholder="Search data..."
		class="h-8 pl-8 pr-8 text-sm"
		bind:value={searchText}
	/>
	{#if searchText}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
			onclick={() => (searchText = '')}
			aria-label="Clear search"
		>
			<X class="size-4" />
		</button>
	{/if}
</div>

<div class="tree-wrapper" style="height: 600px; overflow: hidden;">
	<Tree
		data={flatData}
		idMember="nodeId"
		pathMember="path"
		displayValueMember="name"
		searchValueMember="name"
		orderMember="order"
		shouldUseInternalSearchIndex={true}
		isExpandedMember="isExpanded"
		bind:searchText
		virtualScroll={true}
		virtualRowHeight={44}
		virtualOverscan={2}
		virtualContainerHeight="100%"
		shouldToggleOnNodeClick={true}
		expandLevel={0}
	>
		{#snippet nodeTemplate(treeNode: LTreeNode)}
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

			{@const indentLevel = Math.max(0, (treeNode.level ?? 0) - 1)}
			<div
				class="node-indent-wrap"
				style="margin-left: calc({indentLevel} * var(--tree-step, 1.5rem));"
			>
				<div class="node-card relative overflow-hidden">
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
											onCheckedChange={() =>
												treeviewStore.setVisibilityState(nodeRef.id, !isVisible)}
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
			</div>
		{/snippet}
	</Tree>
</div>

<style>
	/* Override KeenMate tree defaults for custom card styling */
	.tree-wrapper :global(.ltree-node-content) {
		padding: 0 !important;
		border-radius: 0 !important;
		background-color: transparent !important;
	}
	.tree-wrapper :global(.ltree-node-content:hover) {
		background-color: transparent !important;
	}
	.tree-wrapper :global(.ltree-toggle-icon) {
		display: none !important;
	}
	.tree-wrapper :global(.ltree-node) {
		--tree-node-indent-per-level: 0rem;
	}

	.node-card {
		cursor: pointer;
		border-radius: 0.6rem;
		border: 1px solid var(--border);
		box-shadow: none;
		padding: 0.5rem;
		margin-bottom: 0.25rem;
		text-align: left;
		color: var(--card-foreground);
		background-color: var(--card);
		width: 100%;
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	.node-card:hover {
		border-color: color-mix(in oklch, var(--border) 50%, transparent);
		background-color: #f3f4f6;
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	}

	.node-grid {
		display: grid;
		width: 100%;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		column-gap: 0.5rem;
	}

	.node-icons {
		display: inline-flex;
		align-items: center;
		gap: 0;
	}

	.icon-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1rem;
		width: var(--tree-step, 1.5rem);
	}

	.icon-slot :global(svg) {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.node-indent-wrap {
		position: relative;
		width: 100%;
	}

	.node-name {
		min-width: 0;
		white-space: normal;
		word-break: break-word;
		text-align: left;
		line-height: 1.375;
	}

	.node-end {
		justify-self: end;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1rem;
		width: 1.5rem;
	}

	.visibility-wrapper {
		position: relative;
		display: grid;
		grid-template-columns: 0fr;
		transition: grid-template-columns 0.2s ease-out;
		overflow: visible;
	}

	.visibility-wrapper.visible {
		grid-template-columns: 1fr;
	}

	.visibility-inner {
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: translateX(10px);
		transform-origin: center;
		transition:
			opacity 0.2s ease-out,
			transform 0.2s ease-out;
	}

	.visibility-wrapper.visible .visibility-inner {
		opacity: 1;
		transform: translateX(0px);
	}

	.indeterminate-label {
		position: absolute;
		top: 90%;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.55rem;
		line-height: 1;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0.7;
		z-index: 100;
		color: var(--muted-foreground);
	}
</style>
