import { createContext } from 'svelte';
import { LayerDrawState, SelectionState, TreeNode } from '$lib/models/treeview/index.js';

/* Tree event related types and context */
export type TreeEvents = {
	/** Callback when node is clicked. */
	onNodeClick?: (node: TreeNode) => void;
	/** Callback when node visibility changes. */
	onNodeVisibilityChange?: (node: TreeNode, visible: boolean) => void;
	/** Callback when download state changes. */
	onDownloadStateChanged?: (node: TreeNode, downloadState: SelectionState) => void;
	/** Function to get current download state. */
	getDownloadState?: (node: TreeNode) => SelectionState;
	/** Callback when filter is clicked. */
	onFilterClicked?: (layerId: string) => void;
	/** Callback when info is clicked. */
	onInfoClicked?: (layerId: string) => void;
	/** Function to check if filters are applied. */
	hasFiltersApplied?: (layerId: string) => boolean;
	/** Function to get current node visibility. */
	getNodeVisibility?: (nodeId: string) => boolean | undefined;
	/** Function to get current node draw state. */
	getNodeDrawState?: (nodeId: string) => LayerDrawState;
};

export const [getTreeEvents, setTreeEvents] = createContext<TreeEvents>();
