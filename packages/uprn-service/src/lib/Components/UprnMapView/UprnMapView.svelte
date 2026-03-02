<!-- MapView component -->
<script lang="ts">
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
	import type MapView from '@arcgis/core/views/MapView';
	import { onDestroy, onMount } from 'svelte';
	import type { SvelteSet } from 'svelte/reactivity';

	/**
	 * Component props interface
	 */
	type Props = {
		webMap?: __esri.WebMap | null;
		mapView: MapView;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		interactableLayers: SvelteSet<string>;
	};

	const { webMap, mapView, areaSelectionInteractionStore, interactableLayers }: Props = $props();

	/** The map interaction store instance */
	let mapInteractionStore: MapInteractionStore | null = $derived.by(() => {
		return mapView
			? new MapInteractionStore(mapView, areaSelectionInteractionStore, interactableLayers)
			: null;
	});
	let mapContainer: HTMLDivElement | null = null;

	const fallbackBasemap = 'streets-vector';

	export function getLayerViewProvider(): LayerViewProvider {
		if (!mapView) {
			throw new Error('MapView is not initialized');
		}

		return new LayerViewProvider(mapView);
	}

	onMount(async () => {
		//await loadMapViewAsync();
	});

	/**
	 * Creates a fallback map with basic basemap when the main webmap fails to load.
	 * @returns Promise that resolves to a basic Map instance
	 */
	async function createFallbackMap(): Promise<__esri.Map> {
		const { default: Map } = await import('@arcgis/core/Map');
		return new Map({
			basemap: fallbackBasemap
		});
	}

	/**
	 * Updates the map view with a new webMap when the webMap prop changes.
	 * Handles loading and error scenarios gracefully.
	 */
	async function updateMapWithWebMap() {
		if (!webMap) {
			return;
		}

		try {
			//await loadMapViewAsync();
			if (!mapView) {
				console.error('MapView is not initialized');
				return;
			}

			mapView.container = mapContainer;
			mapView.popupEnabled = false;
			mapView.map = webMap;
			mapView.background = { color: '#CFD3D4' };
			mapView.ui.move('zoom', 'top-right');
			console.log('[uprn-map-view] MapView updated with new webMap');

			await areaSelectionInteractionStore.refreshLayerView();
			await areaSelectionInteractionStore.refreshAreas();
		} catch (error) {
			console.error('Error updating MapView with new webMap:', error);
		}
	}

	/**
	 * Initializes the map view with either the provided webMap or a fallback map.
	 * Handles loading, error recovery, and UI setup.
	 * @returns Promise that resolves when map view is loaded and configured
	 */
	// async function loadMapViewAsync() {
	// 	if (!browser) {
	// 		return; // Ensure this runs only in the browser
	// 	}

	// 	if (!mapContainer) {
	// 		console.error('Map container element was not found');
	// 		return;
	// 	}

	// 	try {
	// 		// Try to load the main map (webMap or undefined)
	// 		mapView.container = mapContainer;
	// 		mapView.popupEnabled = false;
	// 		mapView.map = webMap ?? undefined;
	// 		mapView.background = { color: '#CFD3D4' };

	// 		mapView.ui.move('zoom', 'top-right');
	// 		await mapView.when();

	// 		console.log('[uprn-map-view] Map loaded successfully');
	// 	} catch (error) {
	// 		console.error('Error loading map:', error);
	// 		await loadFallbackMap();
	// 	}
	// }

	/**
	 * Loads a fallback map when the primary map fails to load.
	 * Creates a basic map with default basemap and handles any additional errors.
	 */
	async function loadFallbackMap() {
		try {
			const fallbackMap = await createFallbackMap();
			mapView.container = mapContainer;
			mapView.popupEnabled = false;
			mapView.map = fallbackMap;
			await mapView.when();

			console.log('[uprn-map-view] Fallback map loaded');
		} catch (fallbackError) {
			console.error('Error loading fallback map:', fallbackError);
		}
	}

	// === Effects ===

	// Effect to handle webMap changes
	$effect(() => {
		if (!webMap) {
			return;
		}
		updateMapWithWebMap();
	});

	$effect(() => {
		if (!interactableLayers || !mapInteractionStore) {
			return;
		}
		mapInteractionStore.updateInteractableLayers(interactableLayers);
	});

	/**
	 * Cleans up map resources and interaction stores when the component is destroyed.
	 * Destroys the map view and cleans up any associated event listeners.
	 */
	function cleanup() {
		if (mapInteractionStore) {
			mapInteractionStore.cleanup();
		}
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

<style>
	.map-view {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		z-index: 1;
	}
</style>
