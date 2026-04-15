<script lang="ts">
	import { Tree, type LTreeNode } from '@keenmate/svelte-treeview';
	import '@keenmate/svelte-treeview/styles.css';
	import '../treeview-common.css';
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

	/** Guide line type for each indent level of a node. */
	type GuideType = 'full' | 'last' | 'none';

	/** Flat data representation for the KeenMate Tree component. */
	interface FlatDataNode {
		path: string;
		nodeId: string;
		name: string;
		order: number;
		nodeRef: TreeviewNode;
		isExpanded: boolean;
		/** Per-indent-level guide line type: 'full' continues, 'last' stops at center, 'none' hidden. */
		guideLines: GuideType[];
	}

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatDataNode[]>([]);

	/**
	 * Tracks which node IDs are currently expanded.
	 * Updated via onNodeClicked so that parent rows can reactively compute their guide line height.
	 */
	let expandedSet = $state(new Set<string>());

	/** Rebuild flat data whenever tree nodes or tag filters change. */
	$effect(() => {
		const nodes = treeviewStore.getNodes();
		// Read selectedTagIds to establish reactive dependency
		const tags = selectedTagIds;
		const newFlatData = flattenDataNodes(nodes, tags);
		flatData = newFlatData;
		// Reset expansion to initial state (KeenMate also resets when data prop changes)
		expandedSet = new Set(newFlatData.filter((n) => n.isExpanded).map((n) => n.nodeId));
	});

	/**
	 * Flatten the hierarchical tree into a flat array with dot-separated paths.
	 * Applies tag filtering at all levels and excludes hidden nodes.
	 */
	function flattenDataNodes(nodes: TreeviewNode[], activeTags: Set<string>): FlatDataNode[] {
		const result: FlatDataNode[] = [];

		function walk(
			nodes: TreeviewNode[],
			parentPath: string,
			ancestorGuides: GuideType[],
			isRoot: boolean
		) {
			// Pre-filter to visible nodes so we can determine last-sibling status
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
			for (let vi = 0; vi < visible.length; vi++) {
				const { node, config } = visible[vi];
				const isLast = vi === visible.length - 1;
				const path = parentPath ? `${parentPath}.${index}` : `${index}`;

				// Root nodes have no guide lines.
				// Non-root nodes inherit ancestor guides + their own sibling position.
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
					// For descendants: if parent was 'last' at a level, keep 'last' only for the
					// last child (line terminates with its last descendant), otherwise 'full' (line
					// continues to the next sibling).
					const childAncestorGuides = guideLines.map((g) =>
						g === 'last' ? (isLast ? 'last' : 'full') : g
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

	/** Called when a node is clicked; mirrors KeenMate's toggle to keep expandedSet in sync. */
	function handleNodeClicked(node: LTreeNode<FlatDataNode>): void {
		if (!node.hasChildren) return;
		const nodeId = node.data?.nodeId;
		if (!nodeId) return;
		const next = new Set(expandedSet);
		if (next.has(nodeId)) {
			next.delete(nodeId);
		} else {
			next.add(nodeId);
		}
		expandedSet = next;
	}

	/**
	 * Measured available height for the virtual scroll container in pixels.
	 * Updated by the fitToScrollViewport action.
	 */
	let treeHeight = $state(300);

	/**
	 * Svelte action that sizes the virtual tree to fill the nearest
	 * [data-slot="scroll-area-viewport"] ancestor.
	 *
	 * It observes the viewport element for size changes (e.g. window/sidebar
	 * resize) and subtracts the search bar height so the combined content
	 * exactly fills the viewport — preventing the sidebar's own scrollbar
	 * from activating.
	 */
	function fitToScrollViewport(el: HTMLElement) {
		function findViewport(node: HTMLElement | null): HTMLElement | null {
			while (node) {
				if (node.getAttribute('data-slot') === 'scroll-area-viewport') return node;
				node = node.parentElement;
			}
			return null;
		}

		function measure() {
			const viewport = findViewport(el.parentElement);
			if (!viewport) return;
			const treeWrapper = el.querySelector<HTMLElement>('.tree-wrapper');
			if (!treeWrapper) return;
			// Measure directly: space from the tree-wrapper's top edge to the
			// viewport's bottom edge. This automatically accounts for the search
			// bar, any spacing/padding in parent containers, and sibling elements
			// — no hardcoded offsets needed.
			const viewportBottom = viewport.getBoundingClientRect().bottom;
			const treeTop = treeWrapper.getBoundingClientRect().top;
			treeHeight = Math.max(100, viewportBottom - treeTop);
		}

		const viewport = findViewport(el.parentElement);
		const ro = new ResizeObserver(measure);
		if (viewport) ro.observe(viewport);
		ro.observe(el);
		measure();

		return {
			destroy() {
				ro.disconnect();
			}
		};
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

<div use:fitToScrollViewport class="flex flex-col px-3">
	<div class="relative mb-2 w-full">
		<Search
			class="text-muted-foreground pointer-events-none absolute [] left-2.5 top-1/2 size-4 -translate-y-1/2"
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

	<div class="tree-wrapper overflow-hidden">
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
			virtualOverscan={1}
			virtualContainerHeight="{treeHeight}px"
			shouldToggleOnNodeClick={true}
			expandLevel={0}
			onNodeClicked={handleNodeClicked}
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

				{@const guideLines = treeNode.data!.guideLines}
				{@const indentLevel = guideLines.length}
				<div class="node-row px-4">
					{#each guideLines as guide, i}
						{#if guide !== 'none'}
							<div
								class="tree-guide-line"
								class:tree-guide-line-last={guide === 'last'}
								style="left: calc(1rem + {i} * var(--tree-step, 1.5rem) + 0.5rem);"
							></div>
						{/if}
					{/each}
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
				</div>
			{/snippet}
		</Tree>
	</div>
</div>

<style>
	/* Data-specific styles (guide lines & indent) */
	.node-row {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.tree-guide-line {
		position: absolute;
		top: -1px;
		bottom: -1px;
		width: 2px;
		background-color: var(--secondary-foreground);
		opacity: 1;
		z-index: 0;
		pointer-events: none;
	}

	.tree-guide-line-last {
		bottom: auto;
		height: 85%;
	}

	.node-indent-wrap {
		position: relative;
		z-index: 1;
	}
</style>
