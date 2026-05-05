import { SvelteSet } from 'svelte/reactivity';

import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
import type { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
import { TabType } from '$lib/Types/Uprn.types';

import { configureLayerPopupsAndLegend } from './layerConfiguration';

import type MapView from '@arcgis/core/views/MapView';

type ApplyInteractionModeOptions = {
	areaSelectionInteractionStore: AreaSelectionInteractionStore;
	interactableLayers: SvelteSet<string>;
	mapInteractionStore: MapInteractionStore;
	mapView: MapView;
	tab: TabType;
};

/**
 * Applies MapView interaction behavior for the active application tab.
 *
 * Area of Interest enables selection interactions and disables popups. Other tabs
 * disable selection interactions, clear hover state, and enable data-layer popups.
 */
export async function applyTabInteractionMode({
	areaSelectionInteractionStore,
	interactableLayers,
	mapInteractionStore,
	mapView,
	tab
}: ApplyInteractionModeOptions): Promise<void> {
	if (!mapView.map) {
		return;
	}

	const isAreaTab = tab === TabType.AreaOfInterest;
	mapInteractionStore.updateInteractableLayers(isAreaTab ? interactableLayers : new SvelteSet());

	if (isAreaTab) {
		mapView.popupEnabled = false;
		if (mapView.popup?.visible) {
			mapView.popup.close();
		}
	} else {
		mapView.popupEnabled = true;
		areaSelectionInteractionStore.clearHoveredArea();
	}

	for (const layer of mapView.map.allLayers.toArray()) {
		await configureLayerPopupsAndLegend(layer, {
			interactableLayers,
			mapView
		});
	}
}
