<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		mapView: __esri.MapView;
	};

	const { mapView }: Props = $props();

	let mapContainer: HTMLDivElement | null = $state(null);

	onMount(() => {
		mapView.container = mapContainer;
	});

	onDestroy(() => {
		console.log('Destroying MapView in MapView component');
		if (mapView) {
			mapView.container = null; // detach from this DOM node
		}
	});
</script>

<div class="map-view" bind:this={mapContainer}></div>

<style>
	.map-view {
		min-width: 800px;
		width: 100%;
		height: 100%;
	}
</style>
