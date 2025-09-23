<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import type { Snippet } from 'svelte';
	import { watch } from '@arcgis/core/core/reactiveUtils';
	import type { Select } from 'bits-ui';
	import {
		selectedAreasStore,
		type SelectState,
		type HandleInfo
	} from '$lib/stores/selected-areas-store.svelte';

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

			const view: MapView = mapView as MapView;
			view.highlights.push({
				name: 'hover',
				color: 'green',
				haloOpacity: 1,
				fillOpacity: 0
			});

			view.highlights.push({
				name: 'selected',
				color: 'forestgreen',
				haloOpacity: 0.9,
				fillOpacity: 0.3
			});

			view.on('pointer-move', async (event) => {
				const { results } = await view.hitTest(event);
				const result = results[0];
				if (!result) {
					return;
				}

				const graphic = (result as any).graphic as __esri.Graphic;
				const layer = graphic.layer as __esri.FeatureLayer;

				if (!graphic || !layer || graphic.attributes?.[layer.objectIdField] === undefined) {
					//console.log('No graphic found at pointer location');
					selectedAreasStore.hoveredHandle?.handle.remove();
					selectedAreasStore.hoveredHandle = null;
					return;
				}

				const objectIdField = graphic.attributes?.[layer.objectIdField];
				if (
					selectedAreasStore.hoveredHandle &&
					selectedAreasStore.hoveredHandle.id === objectIdField
				) {
					// Already highlighted
					return;
				}

				//console.log('Graphic found at pointer location:', objectIdField);

				const layerView = await view.whenLayerView(layer);
				if (selectedAreasStore.data.featureLayerView !== layerView) {
					selectedAreasStore.setSelectedLayerView(layerView);
				}
				selectedAreasStore.hoveredHandle?.handle.remove();
				selectedAreasStore.hoveredHandle = null;

				const featureLayerView = layerView as __esri.FeatureLayerView;
				if (!featureLayerView) {
					console.warn('LayerView is not a FeatureLayerView');
					return;
				}

				selectedAreasStore.hoveredHandle = {
					id: objectIdField,
					handle: featureLayerView.highlight(graphic, { name: 'hover' })
				};
				const names: string[] | null = await selectedAreasStore.getAreaNamesById([objectIdField]);

				if (names && names.length > 0) {
					//console.log('Hover Area Name:', names[0]);
				}
			});

			view.on('click', async (event) => {
				const { results } = await view.hitTest(event);
				const result = results[0];
				if (!result) {
					return;
				}

				const graphic = (result as any).graphic as __esri.Graphic;
				const layer = graphic.layer as __esri.FeatureLayer;

				if (!graphic || !layer || graphic.attributes?.[layer.objectIdField] === undefined) {
					//console.log('No graphic found at pointer location');
					return;
				}

				// console.log(
				// 	'Graphic found at pointer location:',
				// 	graphic.attributes?.[layer.objectIdField]
				// );

				const layerView = await view.whenLayerView(layer);
				const featureLayerView = layerView as __esri.FeatureLayerView;
				if (!featureLayerView) {
					console.warn('Layer is not a FeatureLayerView');
					return;
				}

				if (selectedAreasStore.data.featureLayerView !== layerView) {
					selectedAreasStore.setSelectedLayerView(layerView);
				}

				const handleInfos: HandleInfo[] = selectedAreasStore.data.highlightHandles || [];
				const existingHandle: HandleInfo | undefined = handleInfos.find(
					(info) => info.id === graphic.attributes?.[layer.objectIdField]
				);

				if (existingHandle) {
					selectedAreasStore.removeSelectedArea(existingHandle.id);
					return;
				}

				let handle = featureLayerView.highlight(graphic, { name: 'selected' });
				selectedAreasStore.addSelectedArea(graphic.attributes?.[layer.objectIdField], handle);
			});

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
					await mapView.when();
					console.log('MapView updated with new webMap');
				} catch (error) {
					console.error('Error updating MapView with new webMap:', error);
				}
			}
		};

		mapView.map = webMap;
		load();
	});

	$effect(() => {
		if (!selectedAreasStore.data || selectedAreasStore.data.highlightHandles.length === 0) {
			return;
		}

		const getSelectedAreaNames = async () => {
			if (!selectedAreasStore.data) {
				return;
			}

			const names: string[] | null = await selectedAreasStore.getAreaNamesById(
				selectedAreasStore.data.highlightHandles.map((h) => h.id)
			);

			console.log('Selected Area Names:', names);
		};

		getSelectedAreaNames();
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
