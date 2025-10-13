import { TreeviewItemType } from '$lib/types/treeview';

export function getLayerTreeviewItemType(layer: __esri.Layer): TreeviewItemType {
	switch (layer.type) {
		case 'group':
			return TreeviewItemType.GroupLayer;
		case 'feature':
			return TreeviewItemType.FeatureLayer;
		case 'tile':
			return TreeviewItemType.TileLayer;
		default:
			throw new Error(`Unsupported layer type: ${layer.type}`);
	}
}
