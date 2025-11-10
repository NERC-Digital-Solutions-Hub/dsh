<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export const ssr = false;

	type Props = {
		mapView: __esri.MapView;
	};

	const { mapView }: Props = $props();

	let mapContainer: HTMLDivElement | null = $state(null);
	let isMapLoaded = $state(false);

	$effect(() => {
		if (!mapView) {
			return;
		}

		if (isMapLoaded) {
			return;
		}

		if (mapContainer) {
			mapView.container = mapContainer;
		}
        
		isMapLoaded = true;
	});
</script>

<div class="view" bind:this={mapContainer}></div>

<style>
	.view {
		min-width: 800px;
		width: 100%;
		height: 100%;
	}
</style>
