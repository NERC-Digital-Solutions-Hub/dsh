<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import type { Snippet } from 'svelte';
	import { mapInteractionStore } from '$lib/stores/map-interaction-store.svelte';
	import { selectedAreasStore } from '$lib/stores/selected-areas-store.svelte';
	import { areaSelectionTreeviewStore } from '$lib/stores/area-selection-tree-view-store.svelte';

	type UIPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'manual';

	type Props = {
		webMap?: __esri.WebMap | null;
		panelPosition?: UIPosition;
		menuPosition?: UIPosition;
		panel?: Snippet;
		menu?: Snippet;
	};

	const {
		webMap = null,
		panelPosition = 'top-left',
		menuPosition = 'top-right',
		panel,
		menu
	}: Props = $props();

	let mapContainer: string | HTMLDivElement | null = null;
	let mapView: MapView | null = $state<MapView | null>(null);
	let panelContainer = $state<HTMLElement | null>(null);
	let menuContainer = $state<HTMLElement | null>(null);

	const fallbackBasemap = 'streets-vector';

	onMount(async () => {
		if (!browser) {
			return; // Ensure this runs only in the browser
		}

		try {
			// Import required modules
			const [{ default: MapView }] = await Promise.all([import('@arcgis/core/views/MapView')]);

			await import('@arcgis/core/assets/esri/themes/light/main.css');

			mapView = new MapView({
				container: mapContainer,
				popupEnabled: false
			});

			// Initialize the map interaction store with the new MapView
			await mapInteractionStore.initializeWithMapView(mapView);

			// Wait for the map to load
			await mapView.when();

			mapView.ui.move('zoom', 'bottom-right');

			// Add UI elements to the map if they exist and positioning is not manual
			if (panelContainer && panelPosition !== 'manual') {
				mapView.ui.add(panelContainer as HTMLElement, panelPosition);
			}

			if (menuContainer && menuPosition !== 'manual') {
				mapView.ui.add(menuContainer as HTMLElement, menuPosition);
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
					map: fallbackMap
				});

				console.log('Fallback map loaded');
			} catch (fallbackError) {
				console.error('Error loading fallback map:', fallbackError);
			}
		}
	});

	$effect(() => {
		if (!mapView || !webMap) {
			return;
		}

		const load = async () => {
			if (mapView) {
				try {
					mapView.map = webMap;
					await mapView.when();

					// Reinitialize the interaction store with the updated MapView
					await mapInteractionStore.initializeWithMapView(mapView);

					console.log('MapView updated with new webMap');
				} catch (error) {
					console.error('Error updating MapView with new webMap:', error);
				}
			}
		};

		load();
	});

	// Effect to log selected area names when areas are selected/deselected
	$effect(() => {
		if (
			!selectedAreasStore.layerHighlightState ||
			selectedAreasStore.layerHighlightState.areaInfos.length === 0
		) {
			return;
		}

		const getSelectedAreaNames = async () => {
			if (!selectedAreasStore.layerHighlightState) {
				return;
			}

			const names: string[] | null = await selectedAreasStore.getAreaNamesById(
				selectedAreasStore.layerHighlightState.areaInfos.map((h) => h.id)
			);

			console.log('Selected Area Names:', names);
		};

		getSelectedAreaNames();
	});

	// Effect to handle visible node changes and update layer view
	$effect(() => {
		if (!areaSelectionTreeviewStore.visibleNode) {
			selectedAreasStore.resetSelectedAreas();
			return;
		}

		const updateSelectedLayerView = async (layer: __esri.FeatureLayer) => {
			if (!mapView) {
				return;
			}

			const layerView = await mapView.whenLayerView(layer);
			if (!layerView) {
				console.warn('Could not get LayerView for the visible node layer');
				return;
			}

			selectedAreasStore.setSelectedLayerView(layerView);
		};

		const featureLayer = areaSelectionTreeviewStore.visibleNode?.layer as __esri.FeatureLayer;
		if (!featureLayer) {
			console.warn('Visible node layer is not a FeatureLayer');
			return;
		}

		updateSelectedLayerView(featureLayer);
	});

	// Cleanup function
	function cleanup() {
		mapInteractionStore.cleanup();
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

{#if panel && panelPosition !== 'manual'}
	<div bind:this={panelContainer} class="esri-ui-element">
		{@render panel()}
	</div>
{/if}

{#if menu && menuPosition !== 'manual'}
	<div bind:this={menuContainer} class="esri-ui-element">
		{@render menu()}
	</div>
{/if}

{#if panel && panelPosition === 'manual'}
	<div class="manual-panel-container">
		{@render panel()}
	</div>
{/if}

{#if menu && menuPosition === 'manual'}
	<div class="manual-menu-container">
		{@render menu()}
	</div>
{/if}

<style>
	.map-view {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		z-index: 1;
	}

	.esri-ui-element {
		position: relative;
	}

	.manual-panel-container,
	.manual-menu-container {
		position: absolute;
		z-index: 10;
	}

	.manual-panel-container {
		top: 10px;
		left: 10px;
	}

	.manual-menu-container {
		top: 10px;
		right: 10px;
	}
</style>
