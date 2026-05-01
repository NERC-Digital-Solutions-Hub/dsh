<script lang="ts">
	import type { LTreeNode } from '@keenmate/svelte-treeview';
	import type { DatasetTreeviewNode } from '$lib/Models/Treeview/DatasetTreeviewNode';
	import type { VariableTreeviewNode } from '$lib/Models/Treeview/Index';
	import type { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeProvider } from '$lib/Services/INodeProvider';
	import type {
		AreaFieldHandleInfo,
		AreaSelectionInteractionStore
	} from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import type { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/Types/Treeview.types.js';
	import { type SelectionTreeviewNode as SelectionTreeviewNodeType } from './SelectionTreeviewNode.svelte';
	import BaseTreeview, {
		type FlatTreeNode,
		type GuideType
	} from '$lib/Components/Treeview/BaseTreeview.svelte';
	import OpenIndicator from '$lib/Components/OpenIndicator/OpenIndicator.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon.js';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	type AreaInfo = {
		id: number;
		name: string;
		HighlightAreaInfo: AreaFieldHandleInfo;
	};

	type SelectionTreeviewNodeTypeWithParent = SelectionTreeviewNodeType & {
		parentId?: string;
	};

	type Props = {
		nodeProvider: INodeProvider;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		dataSelectionStore: DataSelectionStore;
	};

	const {
		nodeProvider,
		nodeConfigProvider,
		areaSelectionInteractionStore,
		dataSelectionStore
	}: Props = $props();

	let areaInfos: AreaInfo[] = $state<AreaInfo[]>([]);

	/** Extended flat node that carries the original SelectionTreeviewNode reference. */
	interface ExportFlatNode extends FlatTreeNode {
		selectionNode: SelectionTreeviewNodeType;
		hasChildren: boolean;
	}

	type ExportTreeNode = LTreeNode<ExportFlatNode>;

	/**
	 * Flatten a hierarchical SelectionTreeviewNode tree into a flat array
	 * for the BaseTreeview component.
	 */
	function flattenSelectionTree(roots: SelectionTreeviewNodeType[]): ExportFlatNode[] {
		const result: ExportFlatNode[] = [];

		function walk(
			nodes: SelectionTreeviewNodeType[],
			parentPath: string,
			ancestorGuides: GuideType[]
		) {
			let index = 1;
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				const isLast = i === nodes.length - 1;
				const path = parentPath ? `${parentPath}.${index}` : `${index}`;
				const guideLines: GuideType[] = parentPath === '' ? [] : [...ancestorGuides, 'full'];

				result.push({
					path,
					nodeId: node.id,
					name: node.name,
					order: index,
					nodeRef: null as unknown as TreeviewNode,
					isExpanded: false,
					guideLines,
					selectionNode: node,
					hasChildren: node.children.length > 0
				});

				if (node.children.length > 0) {
					const childGuides = guideLines.map((g) => (g === 'last' ? 'none' : g)) as GuideType[];
					walk(node.children, path, childGuides);
				}
				index++;
			}
		}

		walk(roots, '', []);
		return result;
	}

	/**
	 * Builds a hierarchical tree structure from selected area infos.
	 * Areas are grouped under their parent layer.
	 */
	let areaSelectionTree: SelectionTreeviewNodeType[] = $derived.by(() => {
		if (areaInfos.length === 0) {
			return [];
		}

		// All areas belong to the same layer, so group them under the layer
		const layerTitle =
			areaSelectionInteractionStore.selectionViewState?.layerView?.layer?.title ?? 'Selected Areas';

		const childNodes: SelectionTreeviewNodeType[] = areaInfos.map((area) => ({
			id: String(area.HighlightAreaInfo?.id),
			name: area.name,
			isVariable: false,
			isLeaf: true,
			children: [],
			typology: TreeviewNodeTypology.Variable
		}));

		// Return a single root node representing the layer with areas as children
		return [
			{
				id: 'area-layer-root',
				name: layerTitle,
				isVariable: false,
				isLeaf: false,
				children: childNodes,
				typology: TreeviewNodeTypology.Area
			}
		];
	});

	/**
	 * Builds a hierarchical tree structure from selected data nodes.
	 * Nodes are grouped by their parent nodes (including ancestors).
	 */
	let dataSelectionTree: SelectionTreeviewNodeType[] = $derived.by(() => {
		const selections = dataSelectionStore.getAllSelections();
		if (selections.length === 0) return [];

		const nodeMap = new Map<string, SelectionTreeviewNodeTypeWithParent>();

		const ensureNode = (node: TreeviewNode): SelectionTreeviewNodeTypeWithParent | null => {
			const existing = nodeMap.get(node.id);
			if (existing) return existing;

			const nodeConfig: TreeviewNodeConfig | undefined = nodeConfigProvider.getConfig(node.id);
			if (!nodeConfig) return null;

			const created: SelectionTreeviewNodeTypeWithParent = {
				id: node.id,
				name: nodeConfig.displayName || nodeConfig.name || node.id,
				isVariable: isVariableNode(node),
				isLeaf: true,
				children: [],
				typology: nodeConfig.typology || TreeviewNodeTypology.Variable,
				parentId: node.parent?.id
			};

			nodeMap.set(node.id, created);
			return created;
		};

		const ensureAncestors = (start: TreeviewNode | undefined) => {
			let current = start;
			while (current) {
				const ensured = ensureNode(current);
				if (!ensured) break;
				current = current.parent?.id ? nodeProvider.getTreeviewNode(current.parent.id) : undefined;
			}
		};

		for (const selection of selections) {
			const base = nodeProvider.getTreeviewNode(selection.nodeId);
			if (!base) continue;

			// include selected node + its ancestors
			ensureAncestors(base);

			// include each selected field node + its ancestors
			for (const variableName of selection.selectedFieldIds) {
				const variableId = `${selection.nodeId}-${variableName}`;
				const variableNode = nodeProvider.getTreeviewNode(variableId);
				if (!variableNode) continue;
				ensureAncestors(variableNode);
			}
		}

		const rootNodes: SelectionTreeviewNodeType[] = [];

		for (const node of nodeMap.values()) {
			if (!node.parentId) {
				rootNodes.push(node);
				continue;
			}
			const parentNode = nodeMap.get(node.parentId);
			if (parentNode) {
				parentNode.children.push(node);
				parentNode.isLeaf = false;
			} else {
				rootNodes.push(node);
			}
		}

		for (const node of nodeMap.values()) {
			node.isLeaf = node.children.length === 0;
		}

		return rootNodes;
	});

	let flatAreaData = $derived(flattenSelectionTree(areaSelectionTree));
	let flatDataData = $derived(flattenSelectionTree(dataSelectionTree));

	$effect(() => {
		if (!areaSelectionInteractionStore) {
			areaInfos = [];
			return;
		}

		if (!areaSelectionInteractionStore.selectionViewState?.areaHandles.size) {
			areaInfos = [];
			return;
		}

		const getAreaInfos = async () => {
			const areaIds = areaSelectionInteractionStore.selectionViewState.areaHandles.keys().toArray();
			const areaNames = await areaSelectionInteractionStore.getAreaNamesById(areaIds);

			const fieldHandleInfos: AreaFieldHandleInfo[] =
				areaSelectionInteractionStore.selectionViewState.areaHandles
					.entries()
					.toArray()
					.map(([id, handle]) => ({ id, handle }));

			const newAreaInfos: AreaInfo[] = [];
			for (let i = 0; i < areaNames.length; i++) {
				newAreaInfos.push({
					id: areaIds[i],
					name: areaNames[i] || 'Unknown Area',
					HighlightAreaInfo: fieldHandleInfos[i]
				});
			}
			areaInfos = newAreaInfos;
		};

		getAreaInfos();
	});

	/**
	 * Removes an area from the selection by its ID.
	 * @param areaId - The string ID of the area to remove (will be converted to number).
	 */
	function removeArea(node: SelectionTreeviewNodeType) {
		if (node.children.length > 0) {
			for (const child of node.children) {
				removeArea(child);
			}
			return;
		}

		const numericId = parseInt(node.id, 10);
		if (!isNaN(numericId)) {
			areaSelectionInteractionStore.removeSelectedArea(numericId);
		}
	}

	/**
	 * Removes a data selection from the store by layer ID.
	 * Also handles removing individual fields.
	 * @param nodeId - The ID of the node to remove (layer ID or field ID in format "layerId::fieldName").
	 */
	function removeDataSelection(node: SelectionTreeviewNodeType) {
		const treeviewNode = nodeProvider.getTreeviewNode(node.id);

		if (treeviewNode && isDatasetNode(treeviewNode)) {
			console.log('[export-menu] Removing data selection for layerId:', node.id);
			dataSelectionStore.removeSelection(node.id);
			return;
		}

		if (!treeviewNode) {
			console.warn('[export-menu] Could not find treeview node for id:', node.id);
			return;
		}

		if (!isVariableNode(treeviewNode)) {
			for (const child of node.children) {
				removeDataSelection(child);
			}
			return;
		}

		if (!node.isVariable) {
			console.warn('[export-menu] Expected a variable selection node for id:', node.id);
			return;
		}

		const layerId = treeviewNode.layerId;
		const fieldName = treeviewNode.variableId;
		const selection = dataSelectionStore.getSelection(layerId);
		if (selection && selection.selectedFieldIds) {
			const newFieldIds = Array.from(selection.selectedFieldIds).filter((id) => id !== fieldName);
			if (newFieldIds.length === 0) {
				// If no fields left, remove the entire layer selection
				dataSelectionStore.removeSelection(layerId);
			} else {
				dataSelectionStore.updateSelection(layerId, newFieldIds);
			}
		}
	}

	/**
	 * Checks if a given node is a DatasetTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
	 */
	function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}

	/**
	 * Checks if a given node is a VariableTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a VariableTreeviewNode, false otherwise.
	 */
	function isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
		return node.type === TreeviewNodeType.Variable;
	}
</script>

<div class="section">
	<div class="section-header pb-0.5">
		<div class="section-title ml-2">
			<MapPinIcon size={16} class="text-gray-500" />
			<h4>Selected Areas</h4>
		</div>
		<p class="text-xs text-muted-foreground mr-2">{areaInfos.length} area(s) selected</p>
	</div>
	{#if flatAreaData.length > 0}
		<BaseTreeview
			data={flatAreaData}
			searchBar={{ enabled: false }}
			virtualScroll={{ enabled: false }}
			rowPadding="0rem"
		>
			{#snippet nodeContent(treeNode: ExportTreeNode)}
				{@const sNode = treeNode.data!.selectionNode}
				{@const isFolder = treeNode.data!.hasChildren}
				{@const icon = getNodeIcon(
					sNode.typology ??
						(isFolder ? TreeviewNodeTypology.Folder : TreeviewNodeTypology.Variable),
					treeNode.isExpanded
				)}
				<div class="node-card relative overflow-hidden rounded-md">
					<div class="node-grid">
						<div class="node-icons">
							{#if isFolder}
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

						<span class="node-name">{sNode.name}</span>

						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="node-end" onclick={(e) => e.stopPropagation()}>
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="remove-btn"
											onclick={() => removeArea(sNode)}
										>
											×
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content side="right">Remove</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>
					</div>
				</div>
			{/snippet}
		</BaseTreeview>
	{:else}
		<p class="no-selection">No areas selected</p>
	{/if}
</div>

<div class="section">
	<div class="section-header pb-0.5">
		<div class="section-title ml-2">
			<DatabaseIcon size={16} class="text-gray-500" />
			<h4>Selected Data</h4>
		</div>
		<p class="text-xs text-muted-foreground mr-2">
			{dataSelectionStore.getAllSelections().length} dataset(s) selected
		</p>
	</div>
	{#if flatDataData.length > 0}
		<BaseTreeview
			data={flatDataData}
			searchBar={{ enabled: false }}
			virtualScroll={{ enabled: false }}
			rowPadding="0rem"
		>
			{#snippet nodeContent(treeNode: ExportTreeNode)}
				{@const sNode = treeNode.data!.selectionNode}
				{@const isFolder = treeNode.data!.hasChildren}
				{@const icon = getNodeIcon(
					sNode.typology ??
						(isFolder ? TreeviewNodeTypology.Folder : TreeviewNodeTypology.Variable),
					treeNode.isExpanded
				)}
				<div class="node-card relative overflow-hidden rounded-md">
					<div class="node-grid">
						<div class="node-icons">
							{#if isFolder}
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

						<span class="node-name">{sNode.name}</span>

						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="node-end" onclick={(e) => e.stopPropagation()}>
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="remove-btn"
											onclick={() => removeDataSelection(sNode)}
										>
											×
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content side="right">Remove</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>
					</div>
				</div>
			{/snippet}
		</BaseTreeview>
	{:else}
		<p class="no-selection">No data selected</p>
	{/if}
</div>

<style>
	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.no-selection {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}

	:global(.remove-btn) {
		height: 1rem;
		width: 1rem;
		min-width: 0;
		padding: 0;
		font-size: 0.875rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.remove-btn:hover) {
		color: #ef4444;
	}
</style>
