<!-- MapView component -->
<script lang="ts">
	/**
	 * UPRN Map View Component
	 *
	 * A Svelte component that renders an ArcGIS MapView with support for:
	 * - WebMap integration with fallback to basic basemap
	 * - Interactive layers configuration
	 * - Custom UI panel and menu positioning
	 * - Area selection and map interaction stores integration
	 * - Automatic cleanup and resource management
	 *
	 * @component
	 * @example
	 * ```svelte
	 * <UPRNMapView
	 *   webMap={myWebMap}
	 *   interactableLayers={['layer1', 'layer2']}
	 *   panelPosition="top-left"
	 *   menuPosition="top-right"
	 * >
	 *   {#snippet panel()}
	 *     <div>Custom panel content</div>
	 *   {/snippet}
	 *   {#snippet menu()}
	 *     <div>Custom menu content</div>
	 *   {/snippet}
	 * </UPRNMapView>
	 * ```
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { mapInteractionStore } from '$lib/stores/map-interaction-store.svelte';
	import { areaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import type Map from '@arcgis/core/Map';
	import type MapView from '@arcgis/core/views/MapView';
	import type WebMap from '@arcgis/core/WebMap';
	import type { TreeviewStore } from '$lib/stores/treeview-store2.svelte';
	import { TreeLayerNode } from '../tree-view/types';

	type UIPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'manual';

	/**
	 * Component props interface
	 */
	type Props = {
		/** The WebMap instance to display. If null, a fallback map will be created */
		webMap?: __esri.WebMap | null;
		/** The area selection treeview store for managing visible node and selections */
		areaSelectionTreeviewStore: TreeviewStore;
		/** Position for the custom panel UI element */
		panelPosition?: UIPosition;
		/** Position for the custom menu UI element */
		menuPosition?: UIPosition;
		/** Snippet for custom panel content */
		panel?: Snippet;
		/** Snippet for custom menu content */
		menu?: Snippet;
	};

	const {
		webMap = null,
		areaSelectionTreeviewStore,
		panelPosition = 'top-left',
		menuPosition = 'top-right',
		panel,
		menu
	}: Props = $props();

	let mapContainer: HTMLDivElement | null = null;
	let mapView: __esri.MapView | null = $state<__esri.MapView | null>(null);
	let panelContainer = $state<HTMLElement | null>(null);
	let menuContainer = $state<HTMLElement | null>(null);
	let uiAttached = $state(false);

	const fallbackBasemap = 'streets-vector';
	let MapContructor: typeof Map;
	let MapViewContructor: typeof MapView;
	let WebMapContructor: typeof WebMap;

	/**
	 * Asynchronously loads the required ArcGIS modules for map functionality.
	 * Only loads modules once and only in browser environment.
	 * @returns Promise that resolves when modules are loaded
	 */
	async function loadEsriAsync() {
		if (!browser) {
			return;
		}

		if (!MapViewContructor) {
			const [{ default: Map }, { default: MapView }, { default: WebMap }] = await Promise.all([
				import('@arcgis/core/Map'),
				import('@arcgis/core/views/MapView'),
				import('@arcgis/core/WebMap')
			]);

			MapContructor = Map;
			MapViewContructor = MapView;
			WebMapContructor = WebMap;
		}
	}

	/**
	 * Creates a new MapView instance with the specified map and container.
	 * @param map - The map instance to display in the view
	 * @param container - The HTML container element for the map
	 * @returns Promise that resolves to the created MapView
	 */
	async function createMapView(
		map: __esri.Map | __esri.WebMap | undefined,
		container: HTMLDivElement
	): Promise<__esri.MapView> {
		const view = new MapViewContructor({
			container: container,
			popupEnabled: false,
			map: map
		});

		await view.when();
		return view;
	}

	/**
	 * Sets up the UI components for the map view, including positioning and adding custom elements.
	 * @param view - The MapView instance to configure
	 */
	function setupMapUI(view: __esri.MapView) {
		view.ui.move('zoom', 'top-right');

		if (panelContainer && panelPosition) {
			view.ui.add(panelContainer as HTMLElement, panelPosition);
		}

		if (menuContainer && menuPosition) {
			view.ui.add(menuContainer as HTMLElement, menuPosition);
		}

		uiAttached = true;
	}

	/**
	 * Initializes the map interaction store with the provided view and interactable layers.
	 * @param view - The MapView instance to initialize interactions for
	 */
	async function initializeMapInteractions(view: __esri.MapView) {
		const nonHiddenNodes = areaSelectionTreeviewStore.getNonHiddenNodes().map((node) => node.id);
		console.log('[uprn-map-view] Initializing map interactions with layers:', nonHiddenNodes);
		await mapInteractionStore.initializeAsync(view, new Set(nonHiddenNodes));
	}

	/**
	 * Creates a fallback map with basic basemap when the main webmap fails to load.
	 * @returns Promise that resolves to a basic Map instance
	 */
	async function createFallbackMap(): Promise<__esri.Map> {
		return new MapContructor({
			basemap: fallbackBasemap
		});
	}

	onMount(async () => {
		await loadEsriAsync();
		await loadMapViewAsync();
	});

	/**
	 * Updates the map view with a new webMap when the webMap prop changes.
	 * Handles loading and error scenarios gracefully.
	 */
	async function updateMapWithWebMap() {
		if (!webMap) {
			return;
		}

		try {
			await loadEsriAsync();
			await loadMapViewAsync();
			if (!mapView) {
				console.error('MapView is not initialized');
				return;
			}

			mapView.map = webMap;
			await webMap.when();
			console.log('[uprn-map-view] MapView updated with new webMap');
		} catch (error) {
			console.error('Error updating MapView with new webMap:', error);
		}
	}

	// Effect to handle webMap changes
	$effect(() => {
		if (!webMap) {
			return;
		}
		updateMapWithWebMap();
	});

	/**
	 * Initializes the map view with either the provided webMap or a fallback map.
	 * Handles loading, error recovery, and UI setup.
	 * @returns Promise that resolves when map view is loaded and configured
	 */
	async function loadMapViewAsync() {
		if (!browser) {
			return; // Ensure this runs only in the browser
		}

		if (!mapContainer) {
			console.error('Map container element was not found');
			return;
		}

		try {
			// Try to load the main map (webMap or undefined)
			mapView = await createMapView(webMap ?? undefined, mapContainer as HTMLDivElement);
			await initializeMapInteractions(mapView);
			setupMapUI(mapView);
			console.log('[uprn-map-view] Map loaded successfully');
		} catch (error) {
			console.error('Error loading map:', error);
			await loadFallbackMap();
		}
	}

	/**
	 * Loads a fallback map when the primary map fails to load.
	 * Creates a basic map with default basemap and handles any additional errors.
	 */
	async function loadFallbackMap() {
		try {
			const fallbackMap = await createFallbackMap();
			mapView = await createMapView(fallbackMap, mapContainer as HTMLDivElement);
			await initializeMapInteractions(mapView);
			setupMapUI(mapView);
			console.log('[uprn-map-view] Fallback map loaded');
		} catch (fallbackError) {
			console.error('Error loading fallback map:', fallbackError);
		}
	}

	// Effect to update interactable layers when they change
	$effect(() => {
		if (!mapView || !areaSelectionTreeviewStore.initialized) {
			return;
		}

		const nonHiddenNodes = areaSelectionTreeviewStore.getNonHiddenNodes().map((node) => node.id);
		mapInteractionStore.updateInteractableLayers(new Set(nonHiddenNodes));
	});

	/**
	 * Updates the selected layer view in the area selection store when a visible node is available.
	 * @param layer - The feature layer to set as the selected layer view
	 */
	async function updateSelectedLayerView(layer: __esri.FeatureLayer) {
		if (!mapView) {
			return;
		}

		const layerView = await mapView.whenLayerView(layer);
		if (!layerView) {
			console.warn('Could not get LayerView for the visible node layer');
			return;
		}

		areaSelectionStore.setSelectedLayerView(layerView);
	}

	// Effect to handle visible node changes and update layer view
	$effect(() => {
		if (!areaSelectionTreeviewStore.initialized) {
			return;
		}

		if (!areaSelectionTreeviewStore.getVisibleNodes().length) {
			areaSelectionStore.resetSelectedAreas();
			return;
		}

		const node = areaSelectionTreeviewStore.getVisibleNodes()[0];
		if (!node || !(node instanceof TreeLayerNode) || !(node.layer instanceof __esri.FeatureLayer)) {
			console.warn('Visible node is not a FeatureLayer');
			return;
		}

		if (!node.layer) {
			console.warn('Visible node layer is not a FeatureLayer');
			return;
		}

		updateSelectedLayerView(node.layer);
	});

	/**
	 * Cleans up map resources and interaction stores when the component is destroyed.
	 * Destroys the map view and cleans up any associated event listeners.
	 */
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

{#if panel}
	<div bind:this={panelContainer} class="esri-ui-element">
		{#if uiAttached}
			{@render panel()}
		{/if}
	</div>
{/if}

{#if menu}
	<div bind:this={menuContainer} class="esri-ui-element">
		{#if uiAttached}
			{@render menu()}
		{/if}
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
</style>
