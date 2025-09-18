import GroupLayerIcon from '$lib/assets/layers-16.svg?raw';
import FeatureLayerIcon from '$lib/assets/feature-layer-16.svg?raw';
import TileLayerIcon from '$lib/assets/tile-layer-16.svg?raw';

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
