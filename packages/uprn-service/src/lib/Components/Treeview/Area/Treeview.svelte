<script lang="ts">
	import type { LTreeNode } from '@keenmate/svelte-treeview';
	import BaseTreeview, {
		type FlatTreeNode,
		type GuideType
	} from '$lib/Components/Treeview/BaseTreeview.svelte';
	import OpenIndicator from '$lib/Components/OpenIndicator/OpenIndicator.svelte';
	import VisibilityCheckbox from '$lib/Components/VisibilityCheckbox/VisibilityCheckbox.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon.js';
	import {
		DatasetTreeviewNode,
		NodeDrawState,
		type TreeviewNode
	} from '$lib/Models/Treeview/Index.js';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import type { IAreaSelectionController } from '$lib/Services/IAreaSelectionController';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';
	import { TreeviewNodeTypology } from '$lib/Types/Treeview.types.js';
	import { Ban } from '@lucide/svelte';
	import { Badge } from '$lib/Components/shadcn/badge/index.js';
	import { fly } from 'svelte/transition';

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

		/** Number of selected areas to display in the toolbar. */
		selectionCount?: number;
	};

	const {
		treeviewStore,
		nodeConfigProvider,
		areaSelectionController,
		selectionCount = 0
	}: Props = $props();

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatTreeNode[]>([]);

	/** Rebuild flat data whenever the underlying tree nodes change. */
	$effect(() => {
		const nodes = treeviewStore.getNodes();
		flatData = flattenAreaNodes(nodes);
	});

	/**
	 * Effect to update the area selection layer when the visible nodes change.
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
	 * Flatten the hierarchical TreeviewNode tree into a flat array with
	 * dot-separated paths for the KeenMate Tree component.
	 *
	 * Area tree rules:
	 * - Root nodes: include all non-hidden nodes.
	 * - Children: include only DatasetTreeviewNode (excludes Variable and Folder children).
	 */
	function flattenAreaNodes(nodes: TreeviewNode[]): FlatTreeNode[] {
		const result: FlatTreeNode[] = [];

		function walk(
			nodes: TreeviewNode[],
			parentPath: string,
			ancestorGuides: GuideType[],
			isRoot: boolean
		) {
			const visible: {
				node: TreeviewNode;
				config: ReturnType<typeof nodeConfigProvider.getConfig>;
			}[] = [];
			for (const node of nodes) {
				const config = nodeConfigProvider.getConfig(node.id);
				if (config?.isHidden) continue;
				if (!isRoot && node.type !== TreeviewNodeType.Dataset) continue;
				visible.push({ node, config });
			}

			let index = 1;
			for (let vi = 0; vi < visible.length; vi++) {
				const { node, config } = visible[vi];
				const isLast = vi === visible.length - 1;
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
	 * Handle node clicks — toggle visibility for leaf nodes.
	 */
	function handleNodeClicked(treeNode: LTreeNode<FlatTreeNode>) {
		if (!treeNode.data) return;
		const nodeRef = treeNode.data.nodeRef;

		if (!treeNode.hasChildren) {
			const config = nodeConfigProvider.getConfig(nodeRef.id);
			if (config?.isEnabled !== false) {
				const isVisible = treeviewStore.getVisibilityState(nodeRef.id);
				treeviewStore.setVisibilityState(nodeRef.id, !isVisible);
			}
		}
	}

	function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}

	function hasVisibleChildren(node: TreeviewNode): boolean {
		return node.children?.some((child) => treeviewStore.getVisibilityState(child.id)) ?? false;
	}
</script>

<BaseTreeview
	data={flatData}
	searchBar={{ enabled: false }}
	virtualScroll={{ enabled: true, overscan: 5 }}
	onNodeClicked={handleNodeClicked}
	rowPadding="1rem"
>
	{#snippet toolbarEnd()}
		<p class="ml-auto shrink-0 text-xs text-muted-foreground leading-none pr-0.5 pb-0.5">
			{selectionCount} area(s) selected
		</p>
	{/snippet}

	{#snippet nodeContent(treeNode: LTreeNode)}
		{@const nodeRef = treeNode.data!.nodeRef}
		{@const config = nodeConfigProvider.getConfig(nodeRef.id)}
		{@const isEnabled = config?.isEnabled ?? false}
		{@const hasChildren = treeNode.hasChildren}
		{@const isVisible = treeviewStore.getVisibilityState(nodeRef.id)}
		{@const drawState = treeviewStore.getNodeDrawState(nodeRef.id)}
		{@const folderHasVisibleChild = hasChildren && hasVisibleChildren(nodeRef)}
		{@const isPressed = (!hasChildren && isVisible) || folderHasVisibleChild}
		{@const icon = getNodeIcon(config?.typology ?? TreeviewNodeTypology.Area, treeNode.isExpanded)}

		<div
			class="node-card relative overflow-hidden rounded-md"
			class:node-card-accent={isPressed}
			class:node-card-disabled={!hasChildren && !isEnabled}
		>
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

				<div class="node-end">
					{#if isPressed}
						<div class="visibility-wrapper visible">
							<div class="visibility-inner">
								<VisibilityCheckbox
									disabled={true}
									checked={true}
									indeterminate={drawState === NodeDrawState.Suspended}
								/>
							</div>
							{#if drawState === NodeDrawState.Suspended}
								<span class="indeterminate-label">zoom</span>
							{/if}
						</div>
					{/if}

					{#if !isEnabled && !hasChildren}
						<span title={config?.disabledReason}>
							<Ban class="size-4 text-red-500" />
						</span>
					{/if}
				</div>
			</div>

			{#if !isEnabled && !hasChildren}
				<span class="pointer-events-none absolute top-1/2 right-8 z-10 beta-badge">
					<Badge
						variant="outline"
						class="w-fit px-1.5 py-0.5 text-[10px] leading-tight whitespace-nowrap bg-pink-100 border-pink-400 opacity-100"
					>
						Not available in beta
					</Badge>
				</span>
			{/if}
		</div>
	{/snippet}
</BaseTreeview>

<style>
	.node-card-accent {
		background-color: var(--accent);
		color: var(--accent-foreground);
	}
	.node-card-accent:hover {
		background-color: var(--accent);
		color: var(--accent-foreground);
	}

	.node-card-disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: auto;
	}

	.beta-badge {
		opacity: 0;
		transform: translate(10px, -50%);
		transition:
			opacity 120ms ease,
			transform 160ms ease;
	}

	.node-card:hover .beta-badge {
		opacity: 1;
		transform: translate(0, -50%);
	}
</style>
