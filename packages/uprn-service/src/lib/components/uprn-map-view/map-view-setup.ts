import { arcgisImport } from '@dsh/common/arcgis';
import type MapView from '@arcgis/core/views/MapView';

const MAP_BACKGROUND = '#CFD3D4';
const FALLBACK_BASEMAP = 'streets-vector';
const MAP_ZOOM_CONSTRAINTS = {
	minZoom: 4,
	maxZoom: 17
} as const;

/**
 * Shared ArcGIS MapView setup used for both configured web maps and fallback maps.
 */
export function configureMapView(mapView: MapView, container: HTMLDivElement): void {
	mapView.container = container;
	mapView.background = { color: MAP_BACKGROUND };
	mapView.popupEnabled = false;
	mapView.ui.move('zoom', 'bottom-left');
	mapView.constraints = {
		...mapView.constraints,
		...MAP_ZOOM_CONSTRAINTS
	};

	configurePopupDocking(mapView);
}

/**
 * Loads a fallback basemap into the current MapView when the configured WebMap cannot be shown.
 */
export async function loadFallbackMap(mapView: MapView, container: HTMLDivElement): Promise<void> {
	try {
		const fallbackMap = await createFallbackMap();

		mapView.map = fallbackMap;
		configureMapView(mapView, container);
		await mapView.when();

		console.log('[uprn-map-view] Fallback map loaded');
	} catch (fallbackError) {
		console.error('Error loading fallback map:', fallbackError);
	}
}

function configurePopupDocking(mapView: MapView): void {
	if (!mapView.popup) {
		return;
	}

	mapView.popup.dockEnabled = true;
	mapView.popup.dockOptions = {
		position: 'bottom-right',
		breakpoint: false
	};
}

async function createFallbackMap(): Promise<__esri.Map> {
	const Map = await arcgisImport<typeof import('@arcgis/core/Map').default>('@arcgis/core/Map.js');

	return new Map({
		basemap: FALLBACK_BASEMAP
	});
}
