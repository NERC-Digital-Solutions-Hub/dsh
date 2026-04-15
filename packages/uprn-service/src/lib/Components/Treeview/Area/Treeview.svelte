<script lang="ts">
	import { Tree, type LTreeNode } from '@keenmate/svelte-treeview';
	import '@keenmate/svelte-treeview/styles.css';
	import '../treeview-common.css';
	import { Input } from '$lib/Components/shadcn/input/index.js';
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
	import { Ban, Search, X } from '@lucide/svelte';

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

	/** Bindable search text for the KeenMate Tree's built-in FlexSearch. */
	let searchText = $state('');

	/** Flat data representation for the KeenMate Tree component. */
	interface FlatAreaNode {
		path: string;
		nodeId: string;
		name: string;
		nodeRef: TreeviewNode;
	}

	/** Use $state.raw to avoid deep proxy overhead on large arrays. */
	let flatData = $state.raw<FlatAreaNode[]>([]);

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
	function flattenAreaNodes(nodes: TreeviewNode[]): FlatAreaNode[] {
		const result: FlatAreaNode[] = [];

		function walk(nodes: TreeviewNode[], parentPath: string, isRoot: boolean) {
			let index = 1;
			for (const node of nodes) {
				const config = nodeConfigProvider.getConfig(node.id);
				if (config?.isHidden) continue;
				if (!isRoot && node.type !== TreeviewNodeType.Dataset) continue;

				const path = parentPath ? `${parentPath}.${index}` : `${index}`;
				result.push({ path, nodeId: node.id, name: node.name, nodeRef: node });

				if (node.children?.length) {
					walk(node.children, path, false);
				}
				index++;
			}
		}

		walk(nodes, '', true);
		return result;
	}

	/**
	 * Handle node clicks — toggle visibility for leaf nodes.
	 */
	function handleNodeClicked(treeNode: LTreeNode<FlatAreaNode>) {
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

<div class="flex flex-col px-3">
	<div class="relative mb-2 w-full">
		<Search
			class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
		/>
		<Input
			type="text"
			placeholder="Search areas..."
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

	<div class="tree-wrapper">
		<Tree
			data={flatData}
			idMember="nodeId"
			pathMember="path"
			displayValueMember="name"
			searchValueMember="name"
			shouldUseInternalSearchIndex={true}
			bind:searchText
			virtualScroll={true}
			virtualRowHeight={44}
			virtualOverscan={5}
			virtualContainerHeight="100%"
			onNodeClicked={handleNodeClicked}
			shouldToggleOnNodeClick={true}
			expandLevel={0}
		>
			{#snippet nodeTemplate(treeNode: LTreeNode)}
				{@const nodeRef = treeNode.data!.nodeRef}
				{@const config = nodeConfigProvider.getConfig(nodeRef.id)}
				{@const isEnabled = config?.isEnabled ?? false}
				{@const hasChildren = treeNode.hasChildren}
				{@const isVisible = treeviewStore.getVisibilityState(nodeRef.id)}
				{@const drawState = treeviewStore.getNodeDrawState(nodeRef.id)}
				{@const folderHasVisibleChild = hasChildren && hasVisibleChildren(nodeRef)}
				{@const isPressed = (!hasChildren && isVisible) || folderHasVisibleChild}
				{@const icon = getNodeIcon(
					config?.typology ?? TreeviewNodeTypology.Area,
					treeNode.isExpanded
				)}

				<div
					class="node-card"
					class:node-card-accent={isPressed}
					class:node-card-disabled={!hasChildren && !isEnabled}
					style="margin-left: calc({Math.max(
						0,
						(treeNode.level ?? 0) - 1
					)} * var(--tree-step, 1.5rem));"
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
				</div>
			{/snippet}
		</Tree>
	</div>
</div>

<style>
	/* Area-specific styles */
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
</style>
