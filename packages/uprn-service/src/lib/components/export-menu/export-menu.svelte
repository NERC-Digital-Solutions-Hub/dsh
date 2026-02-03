<script lang="ts">
	import type { IWebMapService } from '$lib/services/IWebMapService';
	import SelectionTreeNode, {
		type SelectionTreeNode as SelectionTreeNodeType
	} from './selection-tree-node.svelte';
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import type {
		AreaFieldHandleInfo,
		AreaSelectionInteractionStore
	} from '$lib/stores/area-selection-interaction-store.svelte';
	import type { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/types/treeview.js';

	export type Props = {
		webMapService: IWebMapService;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		dataSelectionStore: DataSelectionStore;
		dataSelectionTreeviewConfig: TreeviewConfigStore;
	};

	const {
		webMapService,
		areaSelectionInteractionStore,
		dataSelectionStore,
		dataSelectionTreeviewConfig
	}: Props = $props();

	type AreaInfo = {
		id: number;
		name: string;
		HighlightAreaInfo: AreaFieldHandleInfo;
	};

	let areaInfos: AreaInfo[] = $state<AreaInfo[]>([]);

	/**
	 * Builds a hierarchical tree structure from selected area infos.
	 * Areas are grouped under their parent layer.
	 */
	let areaSelectionTree: SelectionTreeNodeType[] = $derived.by(() => {
		if (areaInfos.length === 0) {
			return [];
		}

		// All areas belong to the same layer, so group them under the layer
		const layerTitle =
			areaSelectionInteractionStore.selectionViewState?.layerView?.layer?.title ?? 'Selected Areas';

		const childNodes: SelectionTreeNodeType[] = areaInfos.map((area) => ({
			id: String(area.HighlightAreaInfo.id),
			name: area.name,
			isLeaf: true,
			children: [],
			typology: TreeviewNodeTypology.Variable
		}));

		// Return a single root node representing the layer with areas as children
		return [
			{
				id: 'area-layer-root',
				name: layerTitle,
				isLeaf: false,
				children: childNodes,
				typology: TreeviewNodeTypology.Area
			}
		];
	});

	/**
	 * Builds a hierarchical tree structure from selected data layers.
	 * Layers are grouped by their parent group layers.
	 * Feature layers with showFields include selected fields as child nodes.
	 */
	let dataSelectionTree: SelectionTreeNodeType[] = $derived.by(() => {
		const selections = dataSelectionStore.getAllSelections();
		if (selections.length === 0) {
			return [];
		}

		// Build a map of all nodes we need to display, including their ancestors
		const nodeMap = new Map<string, SelectionTreeNodeType>();
		const rootNodes: SelectionTreeNodeType[] = [];

		for (const selection of selections) {
			const layer = webMapService.getLayerById(selection.layerId);
			if (!layer) {
				continue;
			}

			const nodeConfig: TreeviewNodeConfig | undefined = dataSelectionTreeviewConfig?.getItemConfig(
				selection.layerId
			);

			const layerTypology = nodeConfig?.typology ?? TreeviewNodeTypology.Variable;

			// Build the path from the selected layer up to the root
			const path: Array<{
				id: string;
				name: string;
				isLeaf: boolean;
				typology: TreeviewNodeTypology;
			}> = [];
			let current: __esri.Layer | __esri.Sublayer | null = layer;

			// Check if this layer should show fields
			const showFields = nodeConfig?.showFields ?? false;
			const hasFieldChildren =
				showFields && layer.type === 'feature' && selection.selectedFieldIds?.size > 0;

			// First, add the selected layer itself
			// If it has field children, it's not a leaf
			path.unshift({
				id: selection.layerId,
				name: layer.title || 'Unknown Layer',
				isLeaf: !hasFieldChildren,
				typology: layerTypology
			});

			// Walk up the parent chain
			while (current && 'parent' in current && current.parent) {
				const parent = current.parent as __esri.Layer | __esri.GroupLayer;
				const parentConfig: TreeviewNodeConfig | undefined =
					dataSelectionTreeviewConfig?.getItemConfig(parent.id);
				if (parent && 'id' in parent) {
					path.unshift({
						id: parent.id,
						name: parent.title || 'Unknown Group',
						isLeaf: false,
						typology: parentConfig?.typology ?? TreeviewNodeTypology.Folder
					});
					current = parent as __esri.Layer;
				} else {
					break;
				}
			}

			// Build tree nodes for this path
			let parentNode: SelectionTreeNodeType | null = null;

			for (let i = 0; i < path.length; i++) {
				const pathItem = path[i];
				let node = nodeMap.get(pathItem.id);

				if (!node) {
					node = {
						id: pathItem.id,
						name: pathItem.name,
						isLeaf: pathItem.isLeaf,
						children: [],
						typology: pathItem.typology
					};
					nodeMap.set(pathItem.id, node);

					if (parentNode) {
						// Add as child of parent if not already present
						if (!parentNode.children.find((c: SelectionTreeNodeType) => c.id === node!.id)) {
							parentNode.children.push(node);
						}
					} else {
						// This is a root node
						if (!rootNodes.find((r: SelectionTreeNodeType) => r.id === node!.id)) {
							rootNodes.push(node);
						}
					}
				}

				parentNode = node;
			}

			// Add field nodes as children of the layer node if showFields is enabled
			if (hasFieldChildren && parentNode) {
				const featureLayer = layer as __esri.FeatureLayer;
				const fields = featureLayer.fields ?? [];

				for (const fieldId of selection.selectedFieldIds) {
					const field = fields.find((f) => f.name === fieldId);
					if (field) {
						const fieldNodeId = `${selection.layerId}::${field.name}`;
						if (!nodeMap.has(fieldNodeId)) {
							const fieldNode: SelectionTreeNodeType = {
								id: fieldNodeId,
								name: field.alias || field.name,
								isLeaf: true,
								children: [],
								typology: TreeviewNodeTypology.Variable
							};
							nodeMap.set(fieldNodeId, fieldNode);
							parentNode.children.push(fieldNode);
						}
					}
				}
			}
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
	function removeArea(areaId: string) {
		const numericId = parseInt(areaId, 10);
		if (!isNaN(numericId)) {
			areaSelectionInteractionStore.removeSelectedArea(numericId);
		}
	}

	/**
	 * Removes a data selection from the store by layer ID.
	 * Also handles removing individual fields.
	 * @param nodeId - The ID of the node to remove (layer ID or field ID in format "layerId::fieldName").
	 */
	function removeDataSelection(nodeId: string) {
		// Check if this is a field node (format: "layerId::fieldName")
		if (nodeId.includes('::')) {
			const [layerId, fieldName] = nodeId.split('::');
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
		} else {
			// This is a layer node
			console.log('[export-menu] Removing data selection for layerId:', nodeId);
			dataSelectionStore.removeSelection(nodeId);
		}
	}
</script>

<h2>Export Options</h2>

<div class="section">
	<h4>Selected Areas</h4>
	{#if areaSelectionTree.length > 0}
		<div class="selection-tree">
			{#each areaSelectionTree as node (node.id)}
				<SelectionTreeNode {node} onRemove={removeArea} />
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
				<SelectionTreeNode {node} onRemove={removeDataSelection} />
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
