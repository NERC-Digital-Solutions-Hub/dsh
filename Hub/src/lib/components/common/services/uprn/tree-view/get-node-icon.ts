import GroupLayerIcon from '$lib/assets/layers-16.svg?raw';
import FeatureLayerIcon from '$lib/assets/feature-layer-16.svg?raw';
import TileLayerIcon from '$lib/assets/tile-layer-16.svg?raw';

export const getNodeIcon = (
	layer: __esri.Layer | __esri.Sublayer,
	useLayerTypeIcon: boolean,
	isFolder: boolean,
	isOpen: boolean
): string => {
	if (useLayerTypeIcon) {
		return getLayerIcon(layer, isFolder);
	}

	// Default icons
	if (isFolder) {
		return isOpen
			? `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`
			: `<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`;
	}

	return `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/>`;
};

export const getLayerIcon = (layer: __esri.Layer | __esri.Sublayer, isFolder: boolean): string => {
	const layerType = layer.type;

	switch (layerType) {
		case 'group':
			return GroupLayerIcon;
		case 'feature':
			return FeatureLayerIcon;
		case 'tile':
			return TileLayerIcon;
		default:
			return isFolder ? GroupLayerIcon : FeatureLayerIcon;
	}
};
