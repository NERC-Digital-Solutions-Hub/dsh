import { TreeviewNode } from '$lib/models/treeview/treeview-node';
import { NodeProvider } from '$lib/services/node-provider';
import { NodeSelectionController } from '$lib/services/node-selection-controller';
import { NodeVisibilityController } from '$lib/services/node-visibility-controller.svelte';
import type { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
import { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
import { TreeviewStore } from '$lib/stores/treeview-store.svelte';
import { TreeviewType, type TreeviewConfig } from '$lib/types/treeview.types';
import { createTreeviewNodes } from '$lib/utilities/create-treeview-nodes';

/** Stable dependency graph shared by area and data treeviews for one app configuration. */
export function createTreeviewRuntime(
	config: TreeviewConfig,
	dataSelectionStore: DataSelectionStore
) {
	const configStore = new TreeviewConfigStore(config);
	const nodes = createTreeviewNodes(configStore.configs);
	const nodeProvider = new NodeProvider(nodes);
	const areaNodes = filterTreeviewNodesByType(nodes, configStore, TreeviewType.Area);
	const dataNodes = filterTreeviewNodesByType(nodes, configStore, TreeviewType.Data);
	const areaNodeProvider = new NodeProvider(areaNodes);
	const dataNodeProvider = new NodeProvider(dataNodes);
	const selectionController = new NodeSelectionController(dataSelectionStore, configStore);
	const visibilityController = new NodeVisibilityController(nodeProvider, configStore, configStore);
	const areaTreeviewStore = new TreeviewStore(
		TreeviewType.Area,
		areaNodeProvider,
		configStore,
		selectionController,
		visibilityController
	);
	const dataTreeviewStore = new TreeviewStore(
		TreeviewType.Data,
		dataNodeProvider,
		configStore,
		selectionController,
		visibilityController
	);

	return {
		configStore,
		nodes,
		nodeProvider,
		areaNodes,
		areaNodeProvider,
		dataNodes,
		dataNodeProvider,
		selectionController,
		visibilityController,
		areaTreeviewStore,
		dataTreeviewStore
	};
}

function filterTreeviewNodesByType(
	nodes: TreeviewNode[],
	configStore: TreeviewConfigStore,
	type: TreeviewType
): TreeviewNode[] {
	return nodes
		.filter((node) => {
			const nodeConfig = configStore.getConfig(node.id);
			return nodeConfig?.treeviewType === type && !nodeConfig.isHidden;
		})
		.map((node) => {
			return node.children
				? cloneNodeWithChildren(node, filterTreeviewNodesByType(node.children, configStore, type))
				: node;
		});
}

function cloneNodeWithChildren<T extends TreeviewNode>(node: T, children: TreeviewNode[]): T {
	const clone = Object.create(Object.getPrototypeOf(node)) as T;
	Object.defineProperties(clone, Object.getOwnPropertyDescriptors(node));
	Object.defineProperty(clone, 'children', {
		value: children,
		enumerable: true,
		configurable: true,
		writable: true
	});
	return clone;
}
