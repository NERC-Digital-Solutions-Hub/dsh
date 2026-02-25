import FeatureLayerIcon from '$lib/Assets/feature-layer-16.svg?raw';
import TileLayerIcon from '$lib/Assets/tile-layer-16.svg?raw';
import { TreeviewNodeTypology } from '$lib/Types/treeview';
import { ChartCandlestick, Folder, FolderOpen, Grid2x2PlusIcon } from '@lucide/svelte';
import type { Component } from 'svelte';

/**
 * Determines the appropriate icon for a tree node based on layer type and state.
 * @param typography - The typology of the treeview node.
 * @param isOpen - Whether the folder is open (only relevant for folders).
 * @returns The SVG icon as a string or a Svelte component.
 */
export const getNodeIcon = (
	typography: TreeviewNodeTypology,
	isOpen: boolean
): string | Component => {
	switch (typography) {
		case TreeviewNodeTypology.Folder:
			return isOpen ? FolderOpen : Folder;
		case TreeviewNodeTypology.DatasetRaster:
			return TileLayerIcon;
		case TreeviewNodeTypology.DatasetVector:
			return FeatureLayerIcon;
		case TreeviewNodeTypology.Variable:
			return ChartCandlestick;
		case TreeviewNodeTypology.Area:
			return Grid2x2PlusIcon;
	}
};
