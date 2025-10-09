<!-- MapSection component -->
<script lang="ts">
	import SvelteMapView from '$lib/components/common/catalogue/map-view/map-view.svelte';
	import SvelteMapBoundingBox from '$lib/components/common/catalogue/map-view/map-bounding-box.svelte';
	import type MapView from '@arcgis/core/views/MapView';

	type Props = {
		portalId?: string | null;
		boundingBox?: {
			xmin: number;
			ymin: number;
			xmax: number;
			ymax: number;
			spatialReference?: { wkid: number };
		} | null;
		showBoundingBox?: boolean;
		boundingBoxColor?: [number, number, number, number];
		interactive?: boolean;
	};

	const {
		portalId = null, //'98fd6151097b4299b099918b2a93c5ec',
		boundingBox = {
			xmin: -87.8,
			ymin: 41.8,
			xmax: -87.5,
			ymax: 42.0,
			spatialReference: { wkid: 4326 }
		},
		showBoundingBox = true,
		boundingBoxColor = [255, 0, 0, 0.3],
		interactive = true
	}: Props = $props();

	// References to components
	let mapViewComponent: SvelteMapView | undefined = $state();
	let boundingBoxComponent: SvelteMapBoundingBox | undefined = $state();
	let mapView: MapView | null | undefined = $derived(mapViewComponent?.getMapView());

	function onBoundingBoxAdded() {
		console.log('[map-section] Bounding box added');
		zoomToBoundingBox();
	}

	// Functions to control the map from parent components
	export function zoomToBoundingBox() {
		if (boundingBoxComponent) {
			boundingBoxComponent.zoomToBoundingBox();
		}
	}

	export function clearBoundingBox() {
		if (boundingBoxComponent) {
			boundingBoxComponent.clearBoundingBox();
		}
	}
</script>

<div class="map-section">
	<div class="map-container">
		<SvelteMapView
			bind:this={mapViewComponent}
			{portalId}
			fallbackBasemap="streets-vector"
			{interactive}
		/>

		<SvelteMapBoundingBox
			bind:this={boundingBoxComponent}
			{mapView}
			{boundingBox}
			visible={showBoundingBox}
			color={boundingBoxColor}
			{onBoundingBoxAdded}
		/>
	</div>
</div>

<style>
	.map-section {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.map-container {
		flex: 1;
		min-height: 0; /* Important for flex child to shrink properly */
	}
</style>
