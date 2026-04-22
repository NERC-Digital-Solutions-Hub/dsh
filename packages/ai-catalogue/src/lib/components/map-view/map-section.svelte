<!-- MapSection component -->
<script lang="ts">
	import SvelteMapView from '$lib/components/map-view/map-view.svelte';
	import SvelteMapBoundingBox from '$lib/components/map-view/map-bounding-box.svelte';
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
		mapMinHeight?: number | string;
		expandFactor?: number;
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
		interactive = true,
		mapMinHeight = 300,
		expandFactor = 1.2
	}: Props = $props();

	// References to components
	let mapViewComponent: SvelteMapView | undefined = $state();
	let boundingBoxComponent: SvelteMapBoundingBox | undefined = $state();
	let mapView: MapView | null | undefined = $derived(mapViewComponent?.getMapView());

	let screenshotDataUrl: string | null = $state(null);
	let mapMounted: boolean = $state(true);

	async function onBoundingBoxAdded() {
		await zoomToBoundingBox();
		if (!interactive && mapView) {
			// Wait for all tiles to finish loading before screenshotting
			if (mapView.updating) {
				await new Promise<void>((resolve) => {
					const handle = mapView!.watch('updating', (updating: boolean) => {
						if (!updating) {
							handle.remove();
							resolve();
						}
					});
				});
			}
			try {
				const screenshot = await mapView.takeScreenshot({ format: 'png' });
				screenshotDataUrl = screenshot.dataUrl;
			} catch (e) {
				console.error('Error capturing map screenshot:', e);
			}
			// Unmount the map components to free the WebGL context and memory
			mapMounted = false;
		}
	}

	// Functions to control the map from parent components
	export async function zoomToBoundingBox() {
		if (boundingBoxComponent) {
			await boundingBoxComponent.zoomToBoundingBox();
		}
	}

	export function clearBoundingBox() {
		if (boundingBoxComponent) {
			boundingBoxComponent.clearBoundingBox();
		}
	}
</script>

<div class="map-section">
	{#if mapMounted}
		<div class="map-container">
			<SvelteMapView
				bind:this={mapViewComponent}
				{portalId}
				fallbackBasemap="streets-vector"
				{interactive}
				minHeight={mapMinHeight}
			/>

			<SvelteMapBoundingBox
				bind:this={boundingBoxComponent}
				{mapView}
				{boundingBox}
				visible={showBoundingBox}
				color={boundingBoxColor}
				{onBoundingBoxAdded}
				{expandFactor}
			/>
		</div>
	{:else if screenshotDataUrl}
		<img src={screenshotDataUrl} alt="Map preview" class="map-screenshot" />
	{/if}
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

	.map-screenshot {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
