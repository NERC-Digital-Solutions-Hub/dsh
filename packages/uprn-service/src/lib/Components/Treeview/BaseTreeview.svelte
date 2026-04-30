<script lang="ts" module>
	import type { TreeviewNode } from '$lib/Models/Treeview/Index.js';

	/** Guide line type for each indent level of a node. */
	export type GuideType = 'full' | 'last' | 'none';

	/** Flat data node for the KeenMate Tree component. */
	export interface FlatTreeNode {
		path: string;
		nodeId: string;
		name: string;
		order: number;
		nodeRef: TreeviewNode;
		isExpanded: boolean;
		guideLines: GuideType[];
	}

	/** Configuration for the search bar. */
	export type SearchBarConfig =
		| { enabled: false }
		| {
				enabled: true;
				placeholder?: string;
				/** Use the expandable/collapsible search bar style. */
				collapsible?: boolean;
		  };

	/** Configuration for virtual scrolling. */
	export type VirtualScrollConfig =
		| { enabled: false }
		| {
				enabled: true;
				/** Row height in pixels. @default 44 */
				rowHeight?: number;
				/** Number of extra rows to render outside the viewport. @default 1 */
				overscan?: number;
				/** Whether to auto-size to the nearest scroll viewport ancestor. @default true */
				fitToViewport?: boolean;
		  };
</script>

<script lang="ts" generics="T extends FlatTreeNode">
	import { Tree, type LTreeNode } from '@keenmate/svelte-treeview';
	import '@keenmate/svelte-treeview/styles.css';
	import './treeview-common.css';
	import ExpandableSearchBar from '$lib/Components/ExpandableSearchBar/ExpandableSearchBar.svelte';
	import { Input } from '$lib/Components/shadcn/input/index.js';
	import { Search, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		/** Flat tree data to render. */
		data: T[];
		/** Search bar configuration. */
		searchBar?: SearchBarConfig;
		/** Virtual scroll configuration. */
		virtualScroll?: VirtualScrollConfig;
		/** Bindable search text. */
		searchText?: string;
		/** Whether clicking a node toggles expansion. @default true */
		shouldToggleOnNodeClick?: boolean;
		/** Initial expand level. @default 0 */
		expandLevel?: number;
		/** Called when a tree node is clicked. */
		onNodeClicked?: (node: LTreeNode<T>) => void;
		/** Called when a tree node is expanded or collapsed. */
		onNodeExpansionChanged?: (node: LTreeNode<T>, isExpanded: boolean) => void;
		/** Snippet for rendering each node row. Receives the LTreeNode and guide line info. */
		nodeContent: Snippet<[LTreeNode<T>]>;
		/** Optional snippet for the toolbar area next to the search bar. */
		toolbarEnd?: Snippet;
		/** Extra CSS classes for the outer container. */
		class?: string;
		/** Horizontal padding for tree rows as a CSS length. @default '0.75rem' */
		rowPadding?: string;
	};

	let {
		data,
		searchBar = { enabled: false },
		virtualScroll = { enabled: true },
		searchText = $bindable(''),
		shouldToggleOnNodeClick = true,
		expandLevel = 0,
		onNodeClicked,
		onNodeExpansionChanged,
		nodeContent,
		toolbarEnd,
		class: className = '',
		rowPadding = '0.75rem'
	}: Props = $props();

	const vsConfig = $derived(
		virtualScroll.enabled
			? {
					rowHeight: virtualScroll.rowHeight ?? 44,
					overscan: virtualScroll.overscan ?? 1,
					fitToViewport: virtualScroll.fitToViewport ?? true
				}
			: null
	);

	/**
	 * Tracks which node IDs are currently expanded.
	 * Kept in sync via handleNodeClicked.
	 */
	let expandedSet = $state(new Set<string>());

	/** Sync expandedSet when data changes (initial expansion state). */
	$effect(() => {
		expandedSet = new Set(data.filter((n) => n.isExpanded).map((n) => n.nodeId));
	});

	/** Measured height for the virtual scroll container. */
	let treeHeight = $state(300);
	let hasVerticalScrollbar = $state(false);
	let verticalScrollbarWidth = $state(0);
	let scheduleLayoutMeasure: (() => void) | null = null;

	$effect(() => {
		data;
		expandedSet;
		searchText;
		treeHeight;
		scheduleLayoutMeasure?.();
	});

	function handleNodeClicked(node: LTreeNode<T>): void {
		if (node.hasChildren) {
			const nodeId = node.data?.nodeId;
			if (nodeId) {
				const next = new Set(expandedSet);
				if (next.has(nodeId)) {
					next.delete(nodeId);
				} else {
					next.add(nodeId);
				}
				expandedSet = next;
				onNodeExpansionChanged?.(node, next.has(nodeId));
			}
		}
		onNodeClicked?.(node);
	}

	/**
	 * Svelte action that sizes the virtual tree to fill the nearest
	 * scroll-area-viewport or card-content ancestor.
	 */
	function fitToScrollViewport(el: HTMLElement) {
		let animationFrame = 0;

		function findViewport(node: HTMLElement | null): HTMLElement | null {
			while (node) {
				const slot = node.getAttribute('data-slot');
				if (slot === 'scroll-area-viewport' || slot === 'card-content') return node;
				node = node.parentElement;
			}
			return null;
		}

		function measure() {
			const viewport = findViewport(el.parentElement);
			const treeWrapper = el.querySelector<HTMLElement>('.tree-wrapper');
			if (viewport && treeWrapper) {
				const viewportBottom = viewport.getBoundingClientRect().bottom;
				const treeTop = treeWrapper.getBoundingClientRect().top;
				treeHeight = Math.max(100, viewportBottom - treeTop);
			}

			const scrollContainer = el.querySelector<HTMLElement>('.ltree-virtual-scroll');
			if (!scrollContainer) {
				hasVerticalScrollbar = false;
				verticalScrollbarWidth = 0;
				return;
			}

			const isOverflowing = scrollContainer.scrollHeight > scrollContainer.clientHeight + 1;
			const scrollbarWidth = scrollContainer.offsetWidth - scrollContainer.clientWidth;
			hasVerticalScrollbar = isOverflowing && scrollbarWidth > 0;
			verticalScrollbarWidth = hasVerticalScrollbar ? scrollbarWidth : 0;
		}

		function scheduleMeasure() {
			cancelAnimationFrame(animationFrame);
			animationFrame = requestAnimationFrame(measure);
		}

		const viewport = findViewport(el.parentElement);
		const ro = new ResizeObserver(scheduleMeasure);
		const mo = new MutationObserver(scheduleMeasure);
		if (viewport) {
			ro.observe(viewport);
		}
		ro.observe(el);
		mo.observe(el, { childList: true, subtree: true });
		scheduleLayoutMeasure = scheduleMeasure;
		scheduleMeasure();

		return {
			destroy() {
				cancelAnimationFrame(animationFrame);
				ro.disconnect();
				mo.disconnect();
				if (scheduleLayoutMeasure === scheduleMeasure) {
					scheduleLayoutMeasure = null;
				}
			}
		};
	}
</script>

<div
	use:fitToScrollViewport
	class="flex flex-col pt-1 {className}"
	class:treeview-has-scrollbar={hasVerticalScrollbar}
	style="--tree-scrollbar-width: {verticalScrollbarWidth}px;"
>
	{#if searchBar.enabled || toolbarEnd}
		<div class="flex mb-1 h-auto w-full items-end" style="padding-inline: {rowPadding};">
			{#if searchBar.enabled}
				{#if searchBar.collapsible}
					<ExpandableSearchBar
						bind:searchText
						placeholder={searchBar.placeholder ?? 'Search...'}
						collapsible
					/>
				{:else}
					<div class="relative h-8 min-w-0 flex-1">
						<Search
							class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
						/>
						<Input
							type="text"
							placeholder={searchBar.placeholder ?? 'Search...'}
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
				{/if}
			{/if}
			{#if toolbarEnd}
				{@render toolbarEnd()}
			{/if}
		</div>
	{/if}

	<div class="tree-wrapper overflow-hidden">
		<Tree
			{data}
			idMember="nodeId"
			pathMember="path"
			displayValueMember="name"
			searchValueMember="name"
			orderMember="order"
			shouldUseInternalSearchIndex={true}
			isExpandedMember="isExpanded"
			bind:searchText
			virtualScroll={!!vsConfig}
			virtualRowHeight={vsConfig?.rowHeight ?? 44}
			virtualOverscan={vsConfig?.overscan ?? 1}
			virtualContainerHeight={vsConfig ? `${treeHeight}px` : '100%'}
			{shouldToggleOnNodeClick}
			{expandLevel}
			onNodeClicked={handleNodeClicked}
		>
			{#snippet nodeTemplate(treeNode: LTreeNode<T>)}
				{@const guideLines = treeNode.data!.guideLines}
				{@const indentLevel = guideLines.length}
				<div class="node-row" style="padding-inline: {rowPadding};">
					{#each guideLines as guide, i}
						{#if guide !== 'none'}
							<div
								class="tree-guide-line"
								style="left: calc({rowPadding} + {i + 0.5} * var(--tree-step, 1.5rem));"
							></div>
						{/if}
					{/each}
					<div
						class="node-indent-wrap"
						style="margin-left: calc({indentLevel} * var(--tree-step, 1.5rem));"
					>
						{@render nodeContent(treeNode as LTreeNode<T>)}
					</div>
				</div>
			{/snippet}
		</Tree>
	</div>
</div>

<style>
	.node-row {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.tree-guide-line {
		position: absolute;
		top: -6px;
		bottom: -1px;
		width: 2px;
		background-color: var(--guide-lines, var(--secondary-foreground));
		transform: translateX(1px);
		opacity: 1;
		z-index: 0;
		pointer-events: none;
	}

	.node-indent-wrap {
		position: relative;
		z-index: 1;
	}
</style>
