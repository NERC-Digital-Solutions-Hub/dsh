import { TreeviewNodeLayerType } from '$lib/Types/treeview';

export function getLayerTreeviewItemType(
	layer: __esri.Layer | __esri.Sublayer
): TreeviewNodeLayerType {
	switch (layer.type) {
		case 'group':
			return TreeviewNodeLayerType.GroupLayer;
		case 'feature':
			return TreeviewNodeLayerType.FeatureLayer;
		case 'tile':
			return TreeviewNodeLayerType.TileLayer;
		case 'map-image':
			return TreeviewNodeLayerType.MapImageLayer;
		case 'sublayer':
			return TreeviewNodeLayerType.TileLayer;
		default:
			throw new Error(`Unsupported layer type: ${layer.type}`);
	}
}

/**
 * Gets the sublayer unique id.
 * @param sublayer The sublayer.
 * @param parent The sublayer parent.
 * @returns The sublayer unique id.
 */
export function getSublayerId(sublayer: __esri.Sublayer, parent: __esri.Layer): string {
	return getSublayerIdFromParentId(sublayer, parent.id);
}

/**
 * Gets the sublayer unique id.
 * @param sublayer The sublayer.
 * @param parentId The sublayer parent id
 * @returns The sublayer unique id.
 */
export function getSublayerIdFromParentId(sublayer: __esri.Sublayer, parentId: string): string {
	return `${parentId}-${sublayer.id}`;
}
