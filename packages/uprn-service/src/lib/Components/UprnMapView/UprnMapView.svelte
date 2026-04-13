<!-- MapView component -->
<script lang="ts">
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
	import { TabType } from '$lib/Types/Uprn.types';
	import type SearchWidget from '@arcgis/core/widgets/Search';
	import type MapView from '@arcgis/core/views/MapView';
	import { onDestroy, onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import LocatorSearchSource from '@arcgis/core/widgets/Search/LocatorSearchSource.js';
	import Extent from '@arcgis/core/geometry/Extent.js';
	import type Legend from '@arcgis/core/widgets/Legend';
	import type Expand from '@arcgis/core/widgets/Expand';
	import PopupTemplate from '@arcgis/core/PopupTemplate.js';
	import * as identify from '@arcgis/core/rest/identify.js';
	import IdentifyParameters from '@arcgis/core/rest/support/IdentifyParameters.js';
	import Point from '@arcgis/core/geometry/Point.js';

	/**
	 * Component props interface
	 */
	type Props = {
		webMap?: __esri.WebMap | null;
		mapView: MapView;
		areaSelectionInteractionStore: AreaSelectionInteractionStore;
		interactableLayers: SvelteSet<string>;
		currentTab: TabType;
	};

	const { webMap, mapView, areaSelectionInteractionStore, interactableLayers, currentTab }: Props =
		$props();

	/** The map interaction store instance */
	let mapInteractionStore: MapInteractionStore | null = $derived.by(() => {
		return mapView
			? new MapInteractionStore(mapView, areaSelectionInteractionStore, interactableLayers)
			: null;
	});
	let mapContainer: HTMLDivElement | null = null;
	let searchWidget: SearchWidget | null = null;
	let legendWidget: Legend | null = null;
	let legendExpand: Expand | null = null;

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
			mapView.ui.move('zoom', 'bottom-left');

			await addSearchWidget();
			await addLegendWidget();

			mapView.constraints = {
				...mapView.constraints,
				minZoom: 4,
				maxZoom: 17
			};

			console.log('[uprn-map-view] MapView updated with new webMap');

			// Configure popup docking after the view is ready
			if (mapView.popup) {
				mapView.popup.dockEnabled = true;
				mapView.popup.dockOptions = {
					position: 'bottom-right',
					breakpoint: false
				};
			}

			await areaSelectionInteractionStore.refreshLayerView();
			await areaSelectionInteractionStore.refreshAreas();

			onAreasOfInterestTabSelected();
		} catch (error) {
			console.error('Error updating MapView with new webMap:', error);
		}
	}

	async function addSearchWidget() {
		if (searchWidget) {
			return;
		}

		const { default: Search } = await import('@arcgis/core/widgets/Search');

		if (searchWidget || !mapView) {
			return;
		}

		const ukSource = new LocatorSearchSource({
			url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
			countryCode: 'GB',
			placeholder: 'Search UK locations'
		});

		const widget = new Search({
			view: mapView,
			popupEnabled: false,
			includeDefaultSources: false,
			sources: [ukSource]
		});

		searchWidget = widget;
		mapView.ui.add(widget, 'top-right');
	}

	async function addLegendWidget() {
		if (legendWidget || !mapView) {
			return;
		}

		const [{ default: Legend }, { default: Expand }] = await Promise.all([
			import('@arcgis/core/widgets/Legend'),
			import('@arcgis/core/widgets/Expand')
		]);

		legendWidget = new Legend({
			view: mapView
		});

		legendExpand = new Expand({
			view: mapView,
			content: legendWidget,
			expandTooltip: 'Legend'
		});

		mapView.ui.add(legendExpand, 'top-right');
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

	/**
	 * Manages map interaction and popup behavior based on the active tab.
	 * - Area of Interest tab: popups disabled, area selection interactions active.
	 * - All other tabs: popups enabled, area selection interactions disabled,
	 *   and area selection layers have their popups individually disabled so
	 *   they don't interfere with area selection data.
	 */
	$effect(() => {
		if (!mapView || !mapView.map || !mapInteractionStore) {
			return;
		}

		onAreasOfInterestTabSelected();
	});

	function onAreasOfInterestTabSelected() {
		if (!mapView || !mapView.map || !mapInteractionStore) {
			return;
		}

		const isAreaTab = currentTab === TabType.AreaOfInterest;

		// Toggle area selection interactions based on the active tab
		mapInteractionStore.updateInteractableLayers(isAreaTab ? interactableLayers : new SvelteSet());

		if (isAreaTab) {
			mapView.popupEnabled = false;
			if (mapView.popup?.visible) {
				mapView.popup.close();
			}
		} else {
			mapView.popupEnabled = true;

			// Clear any active hover highlight when leaving the area tab
			areaSelectionInteractionStore.clearHoveredArea();
		}

		// Disable popups on area selection layers so they never show popups
		// even when the map-level popupEnabled is true.
		const layers = mapView.map.allLayers;
		layers.forEach((layer) => {
			disablePopupsRecursively(layer);
		});
	}

	function disablePopupsRecursively(layer: __esri.Layer | __esri.Sublayer) {
		const title = layer.title?.toLowerCase() ?? '';
		const id = String(layer.id);

		if (interactableLayers.has(id) && 'popupEnabled' in layer) {
			layer.popupEnabled = false;
			console.log(`Disabled popups for interactable layer: ${id}`);
		}

		if (interactableLayers.has(id) && 'legendEnabled' in layer) {
			layer.legendEnabled = false;
		}

		if (title.includes('raster cells')) {
			const rasterLayer = layer as __esri.FeatureLayer | __esri.Sublayer;
			rasterLayer.legendEnabled = false;
			rasterLayer.popupEnabled = true;
			rasterLayer.popupTemplate = createRasterCellsPopupTemplate();
		}

		if (layer.type === 'group') {
			const groupLayer = layer as __esri.GroupLayer;
			for (const childLayer of groupLayer.layers.toArray()) {
				disablePopupsRecursively(childLayer);
			}
		}

		if (layer.type === 'map-image') {
			const mapImageLayer = layer as __esri.MapImageLayer;
			for (const sublayer of mapImageLayer.allSublayers.toArray()) {
				disablePopupsRecursively(sublayer);
			}
		}
	}

	function createRasterCellsPopupTemplate(): __esri.PopupTemplate {
		return new PopupTemplate({
			title: 'Cell {gridcode}',
			outFields: ['*'],
			content: async (context: { graphic: __esri.Graphic }) => {
				const graphic: __esri.Graphic = context.graphic;
				const gridcode: any = graphic.attributes.gridcode;

				const active = getActiveRasterSublayer();
				if (!active) {
					return `
          <b>Gridcode:</b> ${gridcode}<br>
          No active raster layer.
        `;
				}

				const center: __esri.Point | undefined = graphic.geometry?.extent?.center;

				const params = new IdentifyParameters({
					geometry: center,
					tolerance: 1,
					mapExtent: mapView.extent,
					width: mapView.width,
					height: mapView.height,
					dpi: 96,
					returnGeometry: false,
					layerOption: 'visible',
					layerIds: [active.id],
					spatialReference: mapView.spatialReference
				});

				try {
					const response = await identify.identify(active.mapServiceUrl, params);
					const hit = response.results?.[0];

					if (!hit) {
						return `
            <b>Gridcode:</b> ${gridcode}<br>
            No raster value found.
          `;
					}

					const attrs = (hit.feature?.attributes ?? {}) as Record<string, unknown>;

					let valueProp =
						Object.keys(attrs).find((key) => key.includes('Value')) ??
						Object.keys(attrs).find((key) => key.includes('value'));

					if (!valueProp) {
						const numericEntry = Object.entries(attrs).find(([, v]) => {
							if (typeof v === 'number') return true;
							return typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v));
						});
						valueProp = numericEntry?.[0];
					}

					return `
          <b>Gridcode:</b> ${gridcode}<br>
          <b>${'Value'}:</b> ${valueProp ? attrs[valueProp] : 'N/A'}
        `;
				} catch (err) {
					console.error('Identify failed', err);
					return `
          <b>Gridcode:</b> ${gridcode}<br>
          Failed to identify raster value.
        `;
				}
			}
		});
	}

	function getActiveRasterSublayer(): {
		id: number;
		title: string;
		mapServiceUrl: string;
	} | null {
		if (!mapView?.map) {
			return null;
		}

		function findInLayers(layers: __esri.Collection<__esri.Layer>): {
			id: number;
			title: string;
			mapServiceUrl: string;
		} | null {
			for (const layer of layers.toArray()) {
				if (!layer.visible) continue;

				// Case 1: MapImageLayer
				if (layer.type === 'map-image') {
					const mapImageLayer = layer as __esri.MapImageLayer;

					// Pick the visible raster sublayer
					const sublayer = mapImageLayer.allSublayers.find((s) => s.visible);

					if (sublayer) {
						return {
							id: sublayer.id,
							title: sublayer.title ?? 'Unnamed Layer',
							mapServiceUrl: mapImageLayer.url ?? 'Unknown URL'
						};
					}
				}

				// Case 2: GroupLayer (or anything with child layers)
				if ('layers' in layer && layer.layers) {
					const found = findInLayers(layer.layers as __esri.Collection<__esri.Layer>);
					if (found) return found;
				}
			}

			return null;
		}

		return findInLayers(mapView.map.layers);
	}

	/**
	 * Cleans up map resources and interaction stores when the component is destroyed.
	 * Destroys the map view and cleans up any associated event listeners.
	 */
	function cleanup() {
		if (mapInteractionStore) {
			mapInteractionStore.cleanup();
		}
		if (searchWidget) {
			mapView?.ui.remove(searchWidget);
			searchWidget.destroy();
			searchWidget = null;
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
