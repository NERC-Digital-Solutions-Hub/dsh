<!-- MapBoundingBox component -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type MapView from '@arcgis/core/views/MapView';

	type Props = {
		mapView?: MapView | null;
		boundingBox?: {
			xmin: number;
			ymin: number;
			xmax: number;
			ymax: number;
			spatialReference?: { wkid: number };
		} | null;
		visible?: boolean;
		color?: [number, number, number, number];
		onBoundingBoxAdded?: (() => void) | null; // Callback when bounding box is added
	};

	const {
		mapView = null,
		boundingBox = null,
		visible = false,
		color = [255, 0, 0, 0.3],
		onBoundingBoxAdded = null
	}: Props = $props();

	let boundingBoxGraphic: any = null;
	let isInitialized = false;

	// Initialize the component when browser and mapView are available
	$effect(() => {
		if (browser && mapView && !isInitialized) {
			initializeBoundingBox();
		}
	});
	// Update bounding box when props change
	$effect(() => {
		console.log(
			'[map-bounding-box] Props changed - boundingBox:',
			boundingBox,
			'visible:',
			visible
		);
		if (browser && mapView && isInitialized) {
			updateBoundingBox();
		}
	});

	async function initializeBoundingBox() {
		if (!browser || !mapView) return;

		try {
			// Wait for map view to be ready
			await mapView.when();
			isInitialized = true;
			updateBoundingBox();
		} catch (error) {
			console.error('Error initializing bounding box:', error);
		}
	}

	// Function to update bounding box display
	async function updateBoundingBox() {
		if (!mapView || !isInitialized) return;

		// Remove existing bounding box
		if (boundingBoxGraphic) {
			mapView.graphics.remove(boundingBoxGraphic);
			boundingBoxGraphic = null;
		}

		// Add new bounding box if conditions are met
		if (visible && boundingBox) {
			try {
				const [{ default: Graphic }, { default: Extent }, { default: SimpleFillSymbol }] =
					await Promise.all([
						import('@arcgis/core/Graphic'),
						import('@arcgis/core/geometry/Extent'),
						import('@arcgis/core/symbols/SimpleFillSymbol')
					]);

				// Create extent geometry from bounding box
				const extent = new Extent({
					xmin: boundingBox.xmin,
					ymin: boundingBox.ymin,
					xmax: boundingBox.xmax,
					ymax: boundingBox.ymax,
					spatialReference: boundingBox.spatialReference || { wkid: 4326 } // Default to WGS84
				});

				// Create symbol for the bounding box
				const symbol = new SimpleFillSymbol({
					color: color,
					outline: {
						color: [color[0], color[1], color[2], 1], // Solid border
						width: 2
					}
				});

				// Create graphic
				boundingBoxGraphic = new Graphic({
					geometry: extent,
					symbol: symbol
				});

				mapView.graphics.add(boundingBoxGraphic);
				onBoundingBoxAdded?.();
				console.log('Bounding box added to map');
			} catch (error) {
				console.error('Error adding bounding box:', error);
			}
		}
	}

	// Function to zoom to bounding box
	export async function zoomToBoundingBox() {
		if (!mapView || !boundingBox || !isInitialized) return;

		try {
			const { default: Extent } = await import('@arcgis/core/geometry/Extent');

			const extent = new Extent({
				xmin: boundingBox.xmin,
				ymin: boundingBox.ymin,
				xmax: boundingBox.xmax,
				ymax: boundingBox.ymax,
				spatialReference: boundingBox.spatialReference || { wkid: 4326 }
			});

			await mapView.goTo(extent.expand(1.2)); // Add 20% padding around the extent
		} catch (error) {
			console.error('Error zooming to bounding box:', error);
		}
	}

	// Function to clear bounding box
	export function clearBoundingBox() {
		if (mapView && boundingBoxGraphic) {
			mapView.graphics.remove(boundingBoxGraphic);
			boundingBoxGraphic = null;
		}
	}

	// Cleanup function
	function cleanup() {
		if (mapView && boundingBoxGraphic) {
			mapView.graphics.remove(boundingBoxGraphic);
			boundingBoxGraphic = null;
		}
	}

	// Cleanup when component is destroyed
	onDestroy(() => {
		cleanup();
	});
</script>

<!-- This component has no visual representation, it only manages graphics on the map -->
