<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import DropDownPanel from '$lib/components/common/drop-down-panel.svelte';

	type Props = {
		portalId?: string | null; // ArcGIS Online portal item ID
		fallbackBasemap?: string; // Fallback basemap if no portal ID
		zoom?: number; // Initial zoom level
		center?: [number, number]; // Initial center coordinates [longitude, latitude]
	};

	const {
		portalId = null,
		fallbackBasemap = 'streets-vector',
		zoom = undefined,
		center = undefined
	}: Props = $props();

	let mapContainer: string | HTMLDivElement | null = null;
	let mapView: MapView | null = $state<MapView | null>(null);
	let panel = $state<HTMLElement | null>(null);

	export function getMapView() {
		return mapView;
	}

	onMount(async () => {
		if (!browser) {
			return; // Ensure this runs only in the browser
		}

		try {
			// Import required modules
			const [{ default: MapView }, { default: Map }, { default: WebMap }, { default: PortalItem }] =
				await Promise.all([
					import('@arcgis/core/views/MapView'),
					import('@arcgis/core/Map'),
					import('@arcgis/core/WebMap'),
					import('@arcgis/core/portal/PortalItem')
				]);

			await import('@arcgis/core/assets/esri/themes/light/main.css');

			let map;

			// Use portal ID if provided, otherwise create a basic map
			if (portalId) {
				// Create a portal item from the portal ID
				const portalItem = new PortalItem({
					id: portalId
				});

				// Create a WebMap from the portal item
				map = new WebMap({
					portalItem: portalItem
				});
			} else {
				// Fallback to a basic map with specified basemap
				map = new Map({
					basemap: fallbackBasemap
				});
			}

			mapView = new MapView({
				container: mapContainer,
				map: map,
				zoom: zoom,
				center: center
			});

			// Wait for the map to load
			await mapView.when();
			mapView.ui.move('zoom', 'top-right');

			if (panel) {
				mapView.ui.add(panel as HTMLElement, 'top-left');
			}

			console.log('Map loaded successfully');
		} catch (error) {
			console.error('Error loading map:', error);

			// Fallback: create a basic map if portal loading fails
			try {
				const [{ default: MapView }, { default: Map }] = await Promise.all([
					import('@arcgis/core/views/MapView'),
					import('@arcgis/core/Map')
				]);

				const fallbackMap = new Map({
					basemap: fallbackBasemap
				});

				mapView = new MapView({
					container: mapContainer,
					map: fallbackMap,
					zoom: zoom,
					center: center
				});

				console.log('Fallback map loaded');
			} catch (fallbackError) {
				console.error('Error loading fallback map:', fallbackError);
			}
		}
	});

	// Cleanup function
	function cleanup() {
		if (mapView) {
			mapView.destroy();
		}
	}

	// Cleanup when component is destroyed
	onDestroy(() => {
		cleanup();
	});
</script>

<div class="map-view" bind:this={mapContainer}></div>

<!-- <div bind:this={panel}>
	<DropDownPanel />
</div> -->

<style>
	.map-view {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		z-index: 1;
	}
</style>
