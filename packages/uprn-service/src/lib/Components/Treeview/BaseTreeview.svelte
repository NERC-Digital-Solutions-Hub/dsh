<script lang="ts" module>
	import type { TreeviewNode } from '$lib/Models/Treeview/index.js';

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
	import TreeviewToolbar from './TreeviewToolbar.svelte';
	import type { Snippet } from 'svelte';

	type TypedTreeNode = LTreeNode<T>;

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
		onNodeClicked?: (node: TypedTreeNode) => void;
		/** Snippet for rendering each node row. Receives the LTreeNode and guide line info. */
		nodeContent: Snippet<[TypedTreeNode]>;
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

	/** Measured height for the virtual scroll container. */
	let treeHeight = $state<number | null>(null);
	let virtualLayoutRefreshKey = $state(0);
	// KeenMate reads clientHeight inside a derived value, but clientHeight itself is not reactive.
	// Toggling overscan after layout measurement makes it recalculate the visible virtual window.
	const virtualOverscan = $derived(
		vsConfig ? vsConfig.overscan + (virtualLayoutRefreshKey % 2) : 0
	);

	function handleNodeClicked(node: TypedTreeNode): void {
		onNodeClicked?.(node);
	}

	/**
	 * Svelte action that sizes the virtual tree to fill the nearest
	 * scroll-area-viewport or card-content ancestor.
	 */
	function fitToScrollViewport(el: HTMLElement) {
		let animationFrame: number | null = null;
		let virtualRefreshFrame: number | null = null;

		function findViewport(node: HTMLElement | null): HTMLElement | null {
			while (node) {
				const slot = node.getAttribute('data-slot');
				if (slot === 'scroll-area-viewport' || slot === 'card-content') return node;
				node = node.parentElement;
			}
			return null;
		}

		function isHidden(node: HTMLElement): boolean {
			return !!node.closest('[hidden]');
		}

		function measure() {
			if (isHidden(el)) return;

			const viewport = findViewport(el.parentElement);
			if (!viewport) return;

			const treeWrapper = el.querySelector<HTMLElement>('.tree-wrapper');
			if (!treeWrapper) return;

			const viewportBottom = viewport.getBoundingClientRect().bottom;
			const treeTop = treeWrapper.getBoundingClientRect().top;
			const nextTreeHeight = viewportBottom - treeTop;

			if (nextTreeHeight <= 0) return;

			const measuredHeight = Math.max(100, Math.floor(nextTreeHeight));
			if (treeHeight === measuredHeight) return;

			treeHeight = measuredHeight;
			scheduleVirtualLayoutRefresh();
		}

		function updateScrollbarCompensation() {
			if (isHidden(el)) return;

			const treeWrapper = el.querySelector<HTMLElement>('.tree-wrapper');
			const virtualScroller = el.querySelector<HTMLElement>('.ltree-virtual-scroll');
			if (!treeWrapper || !virtualScroller) return;

			const scrollbarWidth = virtualScroller.offsetWidth - virtualScroller.clientWidth;
			const hasScrollbar =
				scrollbarWidth > 0 && virtualScroller.scrollHeight > virtualScroller.clientHeight;
			const compensatedWidth = `${hasScrollbar ? scrollbarWidth : 0}px`;

			treeWrapper.classList.toggle('treeview-has-scrollbar', hasScrollbar);
			if (treeWrapper.style.getPropertyValue('--tree-scrollbar-width') !== compensatedWidth) {
				treeWrapper.style.setProperty('--tree-scrollbar-width', compensatedWidth);
			}
		}

		function scheduleMeasure() {
			if (animationFrame !== null) {
				cancelAnimationFrame(animationFrame);
			}

			animationFrame = requestAnimationFrame(() => {
				animationFrame = requestAnimationFrame(() => {
					animationFrame = null;
					measure();
					updateScrollbarCompensation();
				});
			});
		}

		function scheduleVirtualLayoutRefresh() {
			if (virtualRefreshFrame !== null) {
				cancelAnimationFrame(virtualRefreshFrame);
			}

			virtualRefreshFrame = requestAnimationFrame(() => {
				virtualRefreshFrame = requestAnimationFrame(() => {
					virtualRefreshFrame = null;
					virtualLayoutRefreshKey += 1;
				});
			});
		}

		const viewport = findViewport(el.parentElement);
		const ro = new ResizeObserver(scheduleMeasure);
		if (viewport) ro.observe(viewport);
		ro.observe(el);

		const mo = new MutationObserver(() => {
			updateScrollbarCompensation();
			scheduleMeasure();
		});
		mo.observe(el, {
			attributes: true,
			childList: true,
			subtree: true,
			attributeFilter: ['class', 'style']
		});

		let ancestor = el.parentElement;
		while (ancestor) {
			mo.observe(ancestor, {
				attributeFilter: ['hidden', 'data-state', 'class', 'style']
			});
			ancestor = ancestor.parentElement;
		}

		scheduleMeasure();

		return {
			destroy() {
				if (animationFrame !== null) {
					cancelAnimationFrame(animationFrame);
				}
				if (virtualRefreshFrame !== null) {
					cancelAnimationFrame(virtualRefreshFrame);
				}
				ro.disconnect();
				mo.disconnect();
			}
		};
	}
</script>

<div use:fitToScrollViewport class="flex flex-col pt-1 {className}">
	{#if searchBar.enabled || toolbarEnd}
		<TreeviewToolbar {searchBar} bind:searchText {toolbarEnd} {rowPadding} />
	{/if}

	<div class="tree-wrapper overflow-hidden">
		{#if !vsConfig || treeHeight !== null}
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
				{virtualOverscan}
				virtualContainerHeight={vsConfig ? `${treeHeight}px` : '100%'}
				{shouldToggleOnNodeClick}
				{expandLevel}
				onNodeClicked={handleNodeClicked}
			>
				{#snippet nodeTemplate(treeNode: TypedTreeNode)}
					{@const guideLines = treeNode.data!.guideLines}
					{@const indentLevel = guideLines.length}
					<div class="node-row" style="padding-inline: {rowPadding};">
						{#each guideLines as guide, i (`${treeNode.data!.nodeId}-${i}`)}
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
							{@render nodeContent(treeNode as TypedTreeNode)}
						</div>
					</div>
				{/snippet}
			</Tree>
		{/if}
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
