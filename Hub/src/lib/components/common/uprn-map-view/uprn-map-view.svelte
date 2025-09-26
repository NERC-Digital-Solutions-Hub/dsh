<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import type { Snippet } from 'svelte';
	import { mapInteractionStore } from '$lib/stores/map-interaction-store.svelte';
	import { areaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { areaSelectionTreeviewStore } from '$lib/stores/area-selection-tree-view-store.svelte';

	type UIPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'manual';

	type Props = {
		webMap?: __esri.WebMap | null;
		interactableLayers?: string[];
		panelPosition?: UIPosition;
		menuPosition?: UIPosition;
		panel?: Snippet;
		menu?: Snippet;
	};

	const {
		webMap = null,
		interactableLayers = [],
		panelPosition = 'top-left',
		menuPosition = 'top-right',
		panel,
		menu
	}: Props = $props();

	let mapContainer: HTMLDivElement | null = null;
	let mapView: MapView | null = $state<MapView | null>(null);
	let panelContainer = $state<HTMLElement | null>(null);
	let menuContainer = $state<HTMLElement | null>(null);

	const fallbackBasemap = 'streets-vector';
	let mapViewCtorPromise: Promise<(typeof import('@arcgis/core/views/MapView'))['default']> | null =
		null;
	let mapCtorPromise: Promise<(typeof import('@arcgis/core/Map'))['default']> | null = null;

	async function loadMapViewCtor() {
		if (!browser) {
			throw new Error('Attempted to load MapView constructor outside the browser');
		}

		if (!mapViewCtorPromise) {
			mapViewCtorPromise = import('@arcgis/core/views/MapView').then((module) => module.default);
		}

		return mapViewCtorPromise;
	}

	async function loadFallbackMapCtor() {
		if (!browser) {
			throw new Error('Attempted to load Map constructor outside the browser');
		}

		if (!mapCtorPromise) {
			mapCtorPromise = import('@arcgis/core/Map').then((module) => module.default);
		}

		return mapCtorPromise;
	}

	onMount(async () => {});

	$effect(() => {
		if (!webMap) {
			return;
		}

		const load = async () => {
			try {
				await loadMapView();
				if (!mapView) {
					console.error('MapView is not initialized');
					return;
				}

				mapView.map = webMap;
				await webMap.when();
				console.log('MapView updated with new webMap');
			} catch (error) {
				console.error('Error updating MapView with new webMap:', error);
			}
		};

		load();
	});

	async function loadMapView() {
		if (!browser) {
			return; // Ensure this runs only in the browser
		}

		if (!mapContainer) {
			console.error('Map container element was not found');
			return;
		}

		try {
			const MapViewCtor = await loadMapViewCtor();

			const view = new MapViewCtor({
				container: mapContainer as HTMLDivElement,
				popupEnabled: false,
				map: webMap ?? undefined
			});
			mapView = view;

			await view.when();
			await mapInteractionStore.initializeAsync(view, new Set(interactableLayers));

			view.ui.move('zoom', 'bottom-right');

			// Add UI elements to the map if they exist and positioning is not manual
			if (panelContainer && panelPosition !== 'manual') {
				view.ui.add(panelContainer as HTMLElement, panelPosition);
			}

			if (menuContainer && menuPosition !== 'manual') {
				view.ui.add(menuContainer as HTMLElement, menuPosition);
			}

			console.log('Map loaded successfully');
		} catch (error) {
			console.error('Error loading map:', error);

			// Fallback: create a basic map if portal loading fails
			try {
				const [MapViewCtor, MapCtor] = await Promise.all([
					loadMapViewCtor(),
					loadFallbackMapCtor()
				]);

				const fallbackMap = new MapCtor({
					basemap: fallbackBasemap
				});

				const view = new MapViewCtor({
					container: mapContainer as HTMLDivElement,
					map: fallbackMap,
					popupEnabled: false
				});
				mapView = view;

				await view.when();
				await mapInteractionStore.initializeAsync(view, new Set(interactableLayers));

				view.ui.move('zoom', 'bottom-right');

				if (panelContainer && panelPosition !== 'manual') {
					view.ui.add(panelContainer as HTMLElement, panelPosition);
				}

				if (menuContainer && menuPosition !== 'manual') {
					view.ui.add(menuContainer as HTMLElement, menuPosition);
				}

				console.log('Fallback map loaded');
			} catch (fallbackError) {
				console.error('Error loading fallback map:', fallbackError);
			}
		}
	}

	$effect(() => {
		if (!mapView) {
			return;
		}

		mapInteractionStore.updateInteractableLayers(new Set(interactableLayers));
	});

	// Effect to handle visible node changes and update layer view
	$effect(() => {
		if (!areaSelectionTreeviewStore.visibleNode) {
			areaSelectionStore.resetSelectedAreas();
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

			areaSelectionStore.setSelectedLayerView(layerView);
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
