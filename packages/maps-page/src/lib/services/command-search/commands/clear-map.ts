import type { MapCommand, MapCommandRuntime } from '$lib/types/maps';
import { defineCommand } from '$lib/services/command-search/command-registry';
import { MapViewService } from '$lib/services/command-search/map-view-service';
import { arcgisImport } from '@dsh/common/arcgis';

export const clearMapCommand: MapCommand = {
	id: 'clear-map',
	name: 'Clear map',
	description: 'Clear all layers and reset the map view.',
	shortcut: ['Ctrl', 'C'],
	execute: async (_runtime: MapCommandRuntime) => {
		try {
			console.log('Executing clear map command...');
			const mapView = _runtime.getContext().get(MapViewService).mapView;
			if (mapView) {
				const [Basemap, Map] = await arcgisImport<
					[
						typeof import('@arcgis/core/Basemap.js').default,
						typeof import('@arcgis/core/Map.js').default
					]
				>(['@arcgis/core/Basemap.js', '@arcgis/core/Map.js']);
				const basemap = Basemap.fromId('gray');
				mapView.map = new Map({ basemap });
			}
		} catch (error) {
			console.error('Error clearing map:', error);
		} finally {
			_runtime.deactivate();
		}
	}
};

defineCommand('clear-map', clearMapCommand);
