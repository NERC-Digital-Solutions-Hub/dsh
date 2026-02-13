<script lang="ts">
	import { AliasPathNodeConverter } from '$lib/components/tree-view/services/alias-path-node-converter';
	import * as TreeView from '$lib/components/shadcn/tree-view/index.js';
	import { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import { TreeviewConfigStore } from '$lib/stores/treeview-config-store.js';
	import { TreeviewStore } from '$lib/stores/treeview-store.svelte';
	import {
		LayerDrawState,
		SelectionState,
		TreeLayerNode,
		type TreeNode
	} from '$lib/models/treeview/index.js';
	import { setTreeEvents } from '$lib/events/data-treeview-events.js';
	import Node from './node.svelte';
	import { TreeviewSelectionController } from '$lib/controllers/TreeviewSelectionController.js';
	import type { CustomRendererService } from '$lib/services/custom-renderer-service.js';
	import type { LayerViewProvider } from '$lib/services/layer-view-provider.js';
	import { TreeviewType } from '$lib/types/treeview';
	import type { ITagDefinitionProvider } from '$lib/services/ITagDefinitionProvider';

	/**
	 * Props for the TreeView component.
	 */
	type Props = {
		/** The ESRI WebMap containing layers to display. */
		webMap: __esri.WebMap;

		/** Store for managing data selections. */
		dataSelectionStore: DataSelectionStore;

		/** Provider for layer views. */
		layerViewProvider: LayerViewProvider;

		/** Configuration store for tree view settings. */
		treeviewConfigStore: TreeviewConfigStore;

		/** Optional tag definition provider. */
		tagDefinitionProvider?: ITagDefinitionProvider;

		/** Service for custom renderers */
		customRendererService?: CustomRendererService;

		/** Store for managing field filter menus. */
		fieldFilterMenuStore: FieldFilterMenuStore;

		/** The IDs of currently selected tags to filter by. */
		selectedTagIds?: Set<string>;
	};

	/** Destructured props with defaults. */
	const {
		webMap,
		dataSelectionStore,
		layerViewProvider,
		treeviewConfigStore,
		tagDefinitionProvider,
		customRendererService,
		fieldFilterMenuStore,
		selectedTagIds = new Set<string>()
	}: Props = $props();

	let lastLoadedWebMapId: string | null = null;

	export function clearSelections() {
		treeviewStore.clearSelections();
	}

	/** Instance of the tree view store. */
	const treeviewStore = new TreeviewStore();
	const selectionController = new TreeviewSelectionController(
		dataSelectionStore,
		treeviewConfigStore
	);

	/**
	 * Main effect that watches for webMap changes and rebuilds the layer tree.
	 * Initializes layer visibility and builds the tree structure.
	 */
	$effect(() => {
		if (!webMap || webMap.portalItem?.id === lastLoadedWebMapId) {
			return;
		}

		const initializeWebMap = async () => {
			await webMap.when();
			await loadFeatureLayers(webMap.layers.toArray());

			const aliasPathConverter = new AliasPathNodeConverter(treeviewConfigStore);
			treeviewStore.initialize(
				TreeviewType.Data,
				webMap.layers.toArray(),
				treeviewConfigStore,
				layerViewProvider,
				[aliasPathConverter],
				customRendererService
			);

			lastLoadedWebMapId = webMap.portalItem?.id || null;
		};

		initializeWebMap();
	});

	/**
	 * Loads feature layers recursively to ensure they are ready for field access.
	 * @param layers - Array of layers to load.
	 */
	async function loadFeatureLayers(layers: __esri.Layer[]): Promise<void> {
		for (const layer of layers) {
			if (layer.type === 'feature' && !layer.loaded) {
				await layer.load();
			}

			if (layer.type === 'group') {
				const groupLayer = layer as __esri.GroupLayer;
				await loadFeatureLayers(groupLayer.layers.toArray());
			}
		}
	}

	function onNodeVisibilityChange(node: TreeNode, visible: boolean): void {
		console.log(
			`[tree-view] onNodeVisibilityChange: Setting visibility of node ${node.id} to ${visible}`
		);
		treeviewStore.setVisibilityState(node.id, visible);
	}

	function getNodeDrawState(nodeId: string): LayerDrawState {
		return treeviewStore.getNodeDrawState(nodeId);
	}

	/**
	 * Handles download state changes for a node.
	 * Adds or removes the node from the data selection store.
	 * @param node - The node to update download state for
	 * @param downloadState - The new download state of the node.
	 */
	function onDownloadStateChanged(node: TreeNode, downloadState: SelectionState): void {
		selectionController.updateSelection(node, downloadState);
	}

	/**
	 * Gets the current download state for a node.
	 * @param node - The node to check download state for
	 * @returns The download state of the node
	 */
	function getDownloadState(node: TreeNode): SelectionState {
		return selectionController.getSelectionState(node);
	}

	/**
	 * Handles filter button clicks for a node.
	 * Toggles the filter menu for the specified layer.
	 * @param nodeId - The ID of the node to toggle filters for
	 */
	function handleFilterClicked(nodeId: string): void {
		const currentActiveLayer = fieldFilterMenuStore.ActiveLayer;

		if (currentActiveLayer?.uid === nodeId) {
			// Close filter menu if clicking on the currently active layer
			fieldFilterMenuStore.ActiveLayer = null;
			return;
		}

		// Open filter menu for the clicked layer
		const node = treeviewStore.getNodeById(nodeId);
		if (!node || !(node instanceof TreeLayerNode)) {
			return;
		}

		fieldFilterMenuStore.ActiveLayer = node.layer as __esri.Layer;
	}

	/**
	 * Checks if a node has filters applied.
	 * @param nodeId - The ID of the node to check
	 * @returns True if the node has active filters applied
	 */
	function hasFiltersApplied(nodeId: string): boolean {
		const dataSelection = dataSelectionStore.getSelection(nodeId);
		if (!dataSelection?.selectedFieldIds) {
			return false;
		}

		const node: TreeNode | undefined = treeviewStore.getNodeById(nodeId);
		if (!node || !(node instanceof TreeLayerNode)) {
			return false;
		}

		const totalFields = (node.layer as __esri.FeatureLayer).fields?.length || 0;
		const selectedFields = dataSelection?.selectedFieldIds.size || 0;

		// Consider filters applied if not all fields are selected or no fields are selected
		return selectedFields > 0 && selectedFields !== totalFields;
	}

	// Set tree event handlers
	setTreeEvents({
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		onFilterClicked: handleFilterClicked,
		hasFiltersApplied,
		getNodeVisibility: (nodeId: string) => treeviewStore.getVisibilityState(nodeId),
		getNodeDrawState
	});

	/**
	 * Checks if a node or any of its descendants match the selected tag filters.
	 * @param node - The node to check.
	 * @returns True if the node or any descendant matches the filter criteria.
	 */
	function nodeMatchesTagFilter(node: TreeNode): boolean {
		// If no tags are selected, show all nodes
		if (selectedTagIds.size === 0) {
			return true;
		}

		// Check if this node has any of the selected tags
		const nodeTags = treeviewConfigStore.getTags(node.id);
		const hasMatchingTag = nodeTags.some((tagId) => selectedTagIds.has(tagId));
		if (hasMatchingTag) {
			return true;
		}

		// Check if any child matches the filter (for folder nodes)
		if (node.children?.length) {
			return node.children.some((child) => nodeMatchesTagFilter(child));
		}

		return false;
	}

	/**
	 * Filtered nodes based on selected tag IDs.
	 * When no tags are selected, all nodes are shown.
	 */
	const filteredNodes = $derived.by(() => {
		const allNodes = treeviewStore.getNodes();
		if (selectedTagIds.size === 0) {
			return allNodes;
		}
		return allNodes.filter((node) => nodeMatchesTagFilter(node));
	});
</script>

{#if treeviewStore.initialized}
	<TreeView.Root>
		{#each filteredNodes as node (node.id)}
			<Node
				{node}
				{treeviewConfigStore}
				nodeTagProvider={treeviewConfigStore}
				{tagDefinitionProvider}
				{selectedTagIds}
				isDownloadable={treeviewConfigStore.getConfig(node.id)?.isDownloadable ?? true}
				depth={0}
			/>
		{/each}
	</TreeView.Root>
{/if}

<style>
</style>
