<!-- MapView component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';
	import DropDownPanel from '$lib/components/common/drop-down-panel.svelte';
	import ArcgisTreeView from '$lib/components/common/arcgis-tree-view/arcgis-tree-view.svelte';

	type Props = {
		portalUrl?: string | null; // ArcGIS Online portal URL
		portalId?: string | null; // ArcGIS Online portal item ID
		url?: string | null; // Direct URL to a map service
		proxy?: Proxy | null; // Proxy configuration
		fallbackBasemap?: string; // Fallback basemap if no portal ID
		zoom?: number; // Initial zoom level
		center?: [number, number]; // Initial center coordinates [longitude, latitude]
	};

	type Proxy = {
		urlPrefix: string;
		proxyUrl: string;
	};

	const {
		portalUrl = null,
		portalId = null,
		url = null,
		proxy = null,
		fallbackBasemap = 'streets-vector',
		zoom = undefined,
		center = undefined
	}: Props = $props();

	let webMap: __esri.WebMap | null = $state<__esri.WebMap | null>(null);
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

		if (portalUrl) {
			const esriConfig = await import('@arcgis/core/config.js');
			esriConfig.default.portalUrl = portalUrl as string;
			console.log(esriConfig);

			if (proxy) {
				const urlUtils = await import('@arcgis/core/core/urlUtils.js');
				console.log(urlUtils);
				urlUtils.addProxyRule({
					urlPrefix: proxy?.urlPrefix as string,
					proxyUrl: proxy?.proxyUrl as string
				});
			}
		}

		try {
			// Import required modules
			const [
				{ default: MapView },
				{ default: Map },
				{ default: WebMap },
				{ default: PortalItem },
				{ default: Layer }
			] = await Promise.all([
				import('@arcgis/core/views/MapView'),
				import('@arcgis/core/Map'),
				import('@arcgis/core/WebMap'),
				import('@arcgis/core/portal/PortalItem'),
				import('@arcgis/core/layers/Layer')
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
				webMap = new WebMap({
					portalItem: portalItem
				});
				map = webMap;
			} else if (url) {
				const layer = await Layer.fromArcGISServerUrl({ url });

				map = new Map({
					basemap: fallbackBasemap,
					layers: [layer]
				});

				console.log('Map service loaded from URL:', url);
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

<div bind:this={panel}>
	<DropDownPanel header="Treeview" className="w-120">
		<ArcgisTreeView {webMap} />
	</DropDownPanel>
</div>

<style>
	.map-view {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		z-index: 1;
	}
</style>
