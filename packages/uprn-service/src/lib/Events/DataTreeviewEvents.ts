import { NodeDrawState, SelectionState, TreeviewNode } from '$lib/Models/Treeview/Index.js';
import { createContext } from 'svelte';

/* Tree event related types and context */
export type TreeEvents = {
	/** Callback when node is clicked. */
	onNodeClick?: (node: TreeviewNode) => void;
	/** Callback when node visibility changes. */
	onNodeVisibilityChange?: (node: TreeviewNode, visible: boolean) => void;
	/** Callback when download state changes. */
	onDownloadStateChanged?: (node: TreeviewNode, downloadState: SelectionState) => void;
	/** Function to get current download state. */
	getDownloadState?: (node: TreeviewNode) => SelectionState;
	/** Callback when filter is clicked. */
	onFilterClicked?: (layerId: string) => void;
	/** Callback when info is clicked. */
	onInfoClicked?: (layerId: string) => void;
	/** Function to check if filters are applied. */
	hasFiltersApplied?: (layerId: string) => boolean;
	/** Function to get current node visibility. */
	getNodeVisibility?: (nodeId: string) => boolean | undefined;
	/** Function to get current node draw state. */
	getNodeDrawState?: (nodeId: string) => NodeDrawState;
};

export const [getTreeEvents, setTreeEvents] = createContext<TreeEvents>();
