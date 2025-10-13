import { TreeviewNodeType } from '$lib/types/treeview';

export function getLayerTreeviewItemType(layer: __esri.Layer): TreeviewNodeType {
	switch (layer.type) {
		case 'group':
			return TreeviewNodeType.GroupLayer;
		case 'feature':
			return TreeviewNodeType.FeatureLayer;
		case 'tile':
			return TreeviewNodeType.TileLayer;
		default:
			throw new Error(`Unsupported layer type: ${layer.type}`);
	}
}
