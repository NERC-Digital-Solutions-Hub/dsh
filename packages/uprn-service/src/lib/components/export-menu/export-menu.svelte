<script lang="ts">
	import type { DatasetTreeviewNode } from '$lib/models/treeview/dataset-treeview-node';
	import type { VariableTreeviewNode } from '$lib/models/treeview/index';
	import type { TreeviewNode } from '$lib/models/treeview/treeview-node';
	import { TreeviewNodeType } from '$lib/models/treeview/treeview-node-type';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import type { INodeProvider } from '$lib/services/i-node-provider';
	import type { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
	import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import type { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/types/treeview.types.js';
	import type { SelectionSummaryNode } from '$lib/types/selection-summary.types';
	import SelectionSummarySection from '$lib/components/selection-summary/selection-summary-section.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type AreaInfo = {
		id: number;
		name: string;
		nameStatus: 'loading' | 'loaded' | 'unavailable';
	};

	type ExportSelectionTreeviewNode = SelectionSummaryNode & { parentId?: string };

	type Props = {
		nodeProvider: INodeProvider;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionStore: AreaSelectionStore;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		dataSelectionStore: DataSelectionStore;
		webMapLoaded?: boolean;
	};

	const {
		nodeProvider,
		nodeConfigProvider,
		areaSelectionStore,
		areaSelectionInteractionStore,
		dataSelectionStore,
		webMapLoaded = false
	}: Props = $props();

	let areaInfos: AreaInfo[] = $state<AreaInfo[]>([]);

	/**
	 * Builds a hierarchical tree structure from selected area infos.
	 * Areas are grouped under their parent layer.
	 */
	let areaSelectionTree: ExportSelectionTreeviewNode[] = $derived.by(() => {
		if (areaInfos.length === 0) {
			return [];
		}

		const layerTitle = getAreaLayerTitle(areaSelectionStore.layerId);

		const childNodes: ExportSelectionTreeviewNode[] = areaInfos.map((area) => ({
			id: String(area.id),
			name: area.name,
			nameStatus: area.nameStatus,
			isVariable: false,
			isLeaf: true,
			children: [],
			typology: TreeviewNodeTypology.Variable
		}));

		// Return a single root node representing the layer with areas as children
		return [
			{
				id: areaSelectionStore.layerId ?? 'area-layer-root',
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
	let dataSelectionTree: ExportSelectionTreeviewNode[] = $derived.by(() => {
		const selections = dataSelectionStore.getAllSelections();
		if (selections.length === 0) return [];

		const nodeMap = new SvelteMap<string, ExportSelectionTreeviewNode>();

		const ensureNode = (node: TreeviewNode): ExportSelectionTreeviewNode | null => {
			const existing = nodeMap.get(node.id);
			if (existing) return existing;

			const nodeConfig: TreeviewNodeConfig | undefined = nodeConfigProvider.getConfig(node.id);
			if (!nodeConfig) return null;

			const created: ExportSelectionTreeviewNode = {
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

		const rootNodes: ExportSelectionTreeviewNode[] = [];

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
		const layerId = areaSelectionStore.layerId;
		const areaIds = Array.from(areaSelectionStore.areaIds);
		const selectedLayerViewId =
			areaSelectionInteractionStore.selectionViewState.layerView?.layer?.id;
		void webMapLoaded;
		void selectedLayerViewId;

		if (!layerId || areaIds.length === 0) {
			areaInfos = [];
			return;
		}

		let cancelled = false;
		areaInfos = areaIds.map((id) => ({
			id,
			name: 'Loading area name...',
			nameStatus: 'loading'
		}));

		const getAreaInfos = async () => {
			const areaNames = await areaSelectionInteractionStore.getAreaNamesByLayerId(layerId, areaIds);

			if (cancelled) {
				return;
			}

			const canQueryLayer = areaSelectionInteractionStore.canQueryAreaLayer(layerId);
			areaInfos = areaIds.map((id, i) => {
				const name = areaNames[i];
				const isLoaded = !!name;
				const isUnavailable = !isLoaded && canQueryLayer;

				return {
					id,
					name: name || (isUnavailable ? 'Unknown Area' : 'Loading area name...'),
					nameStatus: isLoaded ? 'loaded' : isUnavailable ? 'unavailable' : 'loading'
				};
			});
		};

		getAreaInfos();

		return () => {
			cancelled = true;
		};
	});

	/**
	 * Removes an area from the selection by its ID.
	 * @param areaId - The string ID of the area to remove (will be converted to number).
	 */
	function removeArea(node: SelectionSummaryNode) {
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
	function removeDataSelection(node: SelectionSummaryNode) {
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

	function getAreaLayerTitle(layerId: string | null): string {
		const node = layerId ? findDatasetNodeByLayerId(layerId) : null;
		if (!node) return 'Selected Areas';

		const nodeConfig = nodeConfigProvider.getConfig(node.id);
		return nodeConfig?.displayName || nodeConfig?.name || node.name || 'Selected Areas';
	}

	function findDatasetNodeByLayerId(layerId: string): DatasetTreeviewNode | null {
		const walk = (nodes: TreeviewNode[]): DatasetTreeviewNode | null => {
			for (const node of nodes) {
				if (isDatasetNode(node) && node.layerId === layerId) {
					return node;
				}

				const match = walk(node.children);
				if (match) {
					return match;
				}
			}

			return null;
		};

		return walk(nodeProvider.getAllTreeviewNodes());
	}
</script>

<SelectionSummarySection
	class="mb-6"
	kind="area"
	title="Selected Areas"
	countLabel={`${areaInfos.length} area(s) selected`}
	nodes={areaSelectionTree}
	emptyText="No areas selected"
	onRemove={removeArea}
/>

<SelectionSummarySection
	kind="data"
	title="Selected Data"
	countLabel={`${dataSelectionStore.getAllSelections().length} dataset(s) selected`}
	nodes={dataSelectionTree}
	emptyText="No data selected"
	onRemove={removeDataSelection}
/>
