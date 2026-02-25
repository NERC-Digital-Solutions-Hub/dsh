<script lang="ts">
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
	import { TreeviewNodeTypology } from '$lib/Types/treeview.js';
	import SelectionTreeviewNode, {
		type SelectionTreeviewNode as SelectionTreeviewNodeType
	} from './selection-tree-node.svelte';

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
			id: String(area.HighlightAreaInfo.id),
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

			const nodeConfig = nodeConfigProvider.getConfig(node.id);
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
		if (!node.isVariable) {
			console.log('[export-menu] Removing data selection for layerId:', node.id);
			dataSelectionStore.removeSelection(node.id);
			return;
		}

		const treeviewNode = nodeProvider.getTreeviewNode(node.id);
		if (!treeviewNode || !isVariableNode(treeviewNode)) {
			console.warn('[export-menu] Could not find treeview node for id:', node.id);
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

<h2>Export Options</h2>

<div class="section">
	<h4>Selected Areas</h4>
	{#if areaSelectionTree.length > 0}
		<div class="selection-tree">
			{#each areaSelectionTree as node (node.id)}
				<SelectionTreeviewNode {node} onRemove={removeArea} />
			{/each}
		</div>
		<p class="count">
			{areaInfos.length} area(s) selected
		</p>
	{:else}
		<p class="no-selection">No areas selected</p>
	{/if}
</div>

<div class="section">
	<h4>Selected Data</h4>
	{#if dataSelectionTree.length > 0}
		<div class="selection-tree">
			{#each dataSelectionTree as node (node.id)}
				<SelectionTreeviewNode {node} onRemove={removeDataSelection} />
			{/each}
		</div>
		<p class="count">{dataSelectionStore.getAllSelections().length} data layer(s) selected</p>
	{:else}
		<p class="no-selection">No data selected</p>
	{/if}
</div>

<style>
	h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.selection-tree {
		margin-bottom: 0.5rem;
	}

	.count {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.no-selection {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}
</style>
