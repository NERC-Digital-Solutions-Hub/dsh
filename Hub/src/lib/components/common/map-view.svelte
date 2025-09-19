<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import type { Snippet } from 'svelte';

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
				container: mapContainer
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
		/* Base class for ArcGIS UI elements */
		position: relative;
	}

	.manual-panel-container,
	.manual-menu-container {
		/* For manual positioning, these containers can be styled as needed */
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
