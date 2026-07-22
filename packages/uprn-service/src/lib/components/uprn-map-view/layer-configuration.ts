import {
	createFeatureLayerPopupTemplate,
	createRasterCellsPopupTemplate,
	type ActiveRasterSublayer
} from './popup-templates';

import type MapView from '@arcgis/core/views/MapView';

type InteractableLayerLookup = Pick<ReadonlySet<string>, 'has'>;

type LayerConfigurationContext = {
	interactableLayers: InteractableLayerLookup;
	mapView: MapView;
};

/**
 * Configures popup and legend behavior for a layer and its descendants.
 *
 * Rules:
 * - interactable layers never show popups and are hidden from the legend
 * - non-interactable feature layers get a generated field-based popup
 * - raster cell layers get a custom identify-driven popup
 */
export async function configureLayerPopupsAndLegend(
	layer: __esri.Layer | __esri.Sublayer,
	context: LayerConfigurationContext
): Promise<void> {
	const id = String(layer.id);
	const title = layer.title?.toLowerCase() ?? '';
	const isInteractable = context.interactableLayers.has(id);
	const isRasterCellsLayer = title.includes('raster cells');

	if (isRasterCellsLayer) {
		if ('legendEnabled' in layer) {
			layer.legendEnabled = false;
		}
		if ('popupEnabled' in layer) {
			layer.popupEnabled = true;
			layer.popupTemplate = await createRasterCellsPopupTemplate(context.mapView, () =>
				getActiveRasterSublayer(context.mapView)
			);
		}
	} else if (isInteractable) {
		if ('popupEnabled' in layer) {
			layer.popupEnabled = false;
		}
		if ('legendEnabled' in layer) {
			layer.legendEnabled = false;
		}
	} else if (layer.type === 'feature') {
		const featureLayer = layer as __esri.FeatureLayer;
		featureLayer.popupEnabled = true;
		featureLayer.popupTemplate = await createFeatureLayerPopupTemplate(featureLayer);
	}

	if (layer.type === 'group') {
		for (const childLayer of (layer as __esri.GroupLayer).layers.toArray()) {
			await configureLayerPopupsAndLegend(childLayer, context);
		}
	}

	if (layer.type === 'map-image') {
		for (const sublayer of (layer as __esri.MapImageLayer).allSublayers.toArray()) {
			await configureLayerPopupsAndLegend(sublayer, context);
		}
	}
}

/**
 * Finds the currently visible raster sublayer from the active map structure.
 */
export function getActiveRasterSublayer(mapView: MapView): ActiveRasterSublayer | null {
	if (!mapView.map) {
		return null;
	}

	return findActiveRasterInLayers(mapView.map.layers);
}

function findActiveRasterInLayers(
	layers: __esri.Collection<__esri.Layer>
): ActiveRasterSublayer | null {
	for (const layer of layers.toArray()) {
		if (!layer.visible) {
			continue;
		}

		if (layer.type === 'map-image') {
			const mapImageLayer = layer as __esri.MapImageLayer;
			const visibleSublayer = mapImageLayer.allSublayers.find((sublayer) => sublayer.visible);

			if (visibleSublayer) {
				return {
					id: visibleSublayer.id,
					title: visibleSublayer.title ?? 'Unnamed Layer',
					mapServiceUrl: mapImageLayer.url ?? 'Unknown URL'
				};
			}
		}

		if ('layers' in layer && layer.layers) {
			const found = findActiveRasterInLayers(layer.layers as __esri.Collection<__esri.Layer>);
			if (found) {
				return found;
			}
		}
	}

	return null;
}
