<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './node.svelte';
	import type { TreeNode } from './types.js';
	import type { TreeviewConfig } from '$lib/utils/app-config-provider.js';
	import { dataSelectionStore, type SelectedData } from '$lib/stores/data-selection-store.svelte';

	type Props = {
		webMap?: __esri.WebMap | null;
		treeviewConfig?: TreeviewConfig[] | null;
	};
	const { webMap = null, treeviewConfig = null }: Props = $props();

	let layerTree: TreeNode[] = $state<TreeNode[]>([]);
	let visibilityState: Map<string, boolean> = $state(new Map());

	$effect(() => {
		if (!webMap) {
			layerTree = [];
			return;
		}

		const fetchData = async () => {
			await webMap.when();
			const tree = await buildTreeFromMap(webMap);
			layerTree = tree;
			initializeVisibilityState(tree);
		};

		fetchData();
	});

	function initializeVisibilityState(nodes: TreeNode[]) {
		const newVisibilityState = new Map<string, boolean>();

		function addNodeVisibility(nodeList: TreeNode[]) {
			for (const node of nodeList) {
				newVisibilityState.set(node.id, node.layer.visible);
				if (node.children && node.children.length) {
					addNodeVisibility(node.children);
				}
			}
		}

		addNodeVisibility(nodes);
		visibilityState = newVisibilityState;
	}

	async function buildTreeFromMap(map: __esri.Map): Promise<TreeNode[]> {
		const nodes: TreeNode[] = [];
		for (const layer of map.layers.toArray()) {
			nodes.push(await layerToNode(layer));
		}

		const filteredNodes = treeviewConfig
			? nodes.filter((node) => treeviewConfig.some((config) => config.name === node.name))
			: nodes;

		const reverseNodes = (nodes: TreeNode[]) => {
			nodes.reverse();
			for (const node of nodes) {
				if (node.children && node.children.length) {
					reverseNodes(node.children);
				}
			}

			return nodes;
		};

		return reverseNodes(filteredNodes);
	}

	async function layerToNode(layer: __esri.Layer): Promise<TreeNode> {
		const base: TreeNode = {
			id: layer.uid,
			name: layer.title as string,
			layer: layer,
			children: []
		};

		if (layer.type === 'group') {
			const g = layer as __esri.GroupLayer;
			base.children = await Promise.all(g.layers.toArray().map((c) => layerToNode(c)));
			return base;
		}

		// MapImageLayer / WMSLayer -> dive into .sublayers (which can be nested)
		if (layer.type === 'map-image' || layer.type === 'wms') {
			const hasSublayers =
				(layer as __esri.MapImageLayer | __esri.WMSLayer).sublayers &&
				(layer as any).sublayers.length > 0;
			if (hasSublayers) {
				base.children = await sublayerCollectionToNodes(
					(layer as __esri.MapImageLayer | __esri.WMSLayer)
						.sublayers as __esri.Collection<__esri.Sublayer>
				);
			}
			return base;
		}

		return base;
	}

	async function sublayerCollectionToNodes(
		sublayers: __esri.Collection<__esri.Sublayer>
	): Promise<TreeNode[]> {
		const nodes: TreeNode[] = [];
		for (const subLayer of sublayers.toArray()) {
			nodes.push(await sublayerToNode(subLayer));
		}
		return nodes;
	}

	async function sublayerToNode(subLayer: __esri.Sublayer): Promise<TreeNode> {
		const node: TreeNode = {
			id: subLayer.uid,
			name: subLayer.title as string,
			layer: subLayer,
			children: []
		};

		if (subLayer.sublayers && subLayer.sublayers.length) {
			node.children = await sublayerCollectionToNodes(subLayer.sublayers);
		}
		return node;
	}

	function handleNodeVisibleToggle(node: TreeNode, visible: boolean) {
		if (!node || !node.layer || !('visible' in node.layer)) {
			return;
		}

		node.layer.visible = visible;
		visibilityState.set(node.id, visible);

		const parentLayer = node.layer.parent as __esri.GroupLayer;
		if (parentLayer && parentLayer.type === 'group') {
			function tryActivateParentLayer(layer: __esri.Layer) {
				if (layer.type !== 'group') {
					return;
				}

				const groupLayer = layer as __esri.GroupLayer;
				if (!groupLayer.visible && groupLayer.layers.some((layer) => layer.visible)) {
					groupLayer.visible = true;
					visibilityState.set(groupLayer.uid, true);
				}

				const groupParentLayer = groupLayer.parent as __esri.GroupLayer;
				if (groupParentLayer && groupParentLayer.type === 'group') {
					tryActivateParentLayer(groupParentLayer);
				}
			}

			let anyChildVisible = false;
			for (const child of parentLayer.layers) {
				if (child.visible) {
					anyChildVisible = true;
					break;
				}
			}

			if (anyChildVisible && visible) {
				parentLayer.visible = anyChildVisible;
				visibilityState.set(parentLayer.uid, anyChildVisible);
				tryActivateParentLayer(parentLayer);
			}

			const currentParentVisibility = visibilityState.get(parentLayer.uid) ?? parentLayer.visible;
			if (currentParentVisibility !== anyChildVisible && !anyChildVisible) {
				parentLayer.visible = anyChildVisible;
				visibilityState.set(parentLayer.uid, anyChildVisible);
			}
		}

		visibilityState = new Map(visibilityState); // Force reactivity update by creating a new Map
	}

	function getNodeVisibility(nodeId: string): boolean | undefined {
		return visibilityState.get(nodeId);
	}

	function onDownloadStateChanged(node: TreeNode, isActive: boolean) {
		if (isActive) {
			const selectedData: SelectedData = {
				layerId: node.id,
				name: node.layer.title || '',
				fields: null
			};
			dataSelectionStore.SelectedData.set(node.id, selectedData);
		} else {
			dataSelectionStore.SelectedData.delete(node.id);
		}
	}

	function getDownloadState(node: TreeNode): boolean {
		return dataSelectionStore.SelectedData.has(node.id);
	}

	function handleFilterClicked(node: TreeNode) {
		if (dataSelectionStore.FieldViewSelection === node.id) {
			dataSelectionStore.FieldViewSelection = null;
		} else {
			dataSelectionStore.FieldViewSelection = node.id;
		}
	}

	function hasFiltersApplied(node: TreeNode): boolean {
		return false;
	}
</script>

<TreeView.Root>
	{#each layerTree as node (node.id)}
		<Node
			{treeviewConfig}
			{node}
			isDownloadable={treeviewConfig?.find((cfg) => cfg.name === node.name)?.isDownloadable ?? true}
			onNodeClick={() => {}}
			onNodeVisibilityChange={handleNodeVisibleToggle}
			{getNodeVisibility}
			{onDownloadStateChanged}
			{getDownloadState}
			onFilterClicked={handleFilterClicked}
			{hasFiltersApplied}
			depth={0}
			useLayerTypeIcon={true}
		/>
	{/each}
</TreeView.Root>

<style>
</style>
