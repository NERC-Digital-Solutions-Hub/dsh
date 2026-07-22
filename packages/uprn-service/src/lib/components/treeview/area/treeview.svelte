<script lang="ts">
	import type { LTreeNode } from '@keenmate/svelte-treeview';
	import BaseTreeview, { type FlatTreeNode } from '$lib/components/treeview/base-treeview.svelte';
	import { getNodeIcon } from '$lib/components/treeview/get-node-icon.js';
	import TreeviewNodeCard from '$lib/components/treeview/treeview-node-card.svelte';
	import TreeviewVisibilityAction from '$lib/components/treeview/treeview-visibility-action.svelte';
	import { flattenAreaNodes, isDatasetNode } from '$lib/components/treeview/treeview-flattening';
	import type { TreeviewNode } from '$lib/models/treeview/index.js';
	import type { IAreaSelectionController } from '$lib/services/i-area-selection-controller';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import { TreeviewStore } from '$lib/stores/treeview-store.svelte';
	import { TreeviewNodeTypology } from '$lib/types/treeview.types.js';

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

	type AreaTreeNode = LTreeNode<FlatTreeNode>;

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
		flatData = flattenAreaNodes(nodes, nodeConfigProvider);
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

		const node = visibleNodes.find((n) => isDatasetNode(n));
		if (!node) {
			return;
		}

		areaSelectionController.setAreaSelectionLayer(node.layerId);
	});

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
		<p class="ml-auto shrink-0 text-xs text-muted-foreground leading-none pr-2 pb-0.5">
			{selectionCount} area(s) selected
		</p>
	{/snippet}

	{#snippet nodeContent(treeNode: AreaTreeNode)}
		{@const nodeRef = treeNode.data!.nodeRef}
		{@const config = nodeConfigProvider.getConfig(nodeRef.id)}
		{@const isEnabled = config?.isEnabled ?? false}
		{@const hasChildren = treeNode.hasChildren}
		{@const isVisible = treeviewStore.getVisibilityState(nodeRef.id)}
		{@const drawState = treeviewStore.getNodeDrawState(nodeRef.id)}
		{@const folderHasVisibleChild = hasChildren && hasVisibleChildren(nodeRef)}
		{@const isPressed = (!hasChildren && isVisible) || folderHasVisibleChild}
		{@const icon = getNodeIcon(config?.typology ?? TreeviewNodeTypology.Area, treeNode.isExpanded)}

		<TreeviewNodeCard
			{hasChildren}
			isOpen={treeNode.isExpanded}
			{isPressed}
			disabled={!hasChildren && !isEnabled}
			disabledReason={config?.disabledReason}
			{icon}
			name={nodeRef.name}
		>
			{#snippet actions()}
				{#if isPressed}
					<TreeviewVisibilityAction checked={true} disabled={true} {drawState} />
				{/if}
			{/snippet}
		</TreeviewNodeCard>
	{/snippet}
</BaseTreeview>
