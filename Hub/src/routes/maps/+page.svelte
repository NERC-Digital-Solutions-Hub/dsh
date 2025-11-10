<script lang="ts">
	import MapView from '$lib/components/common/maps/map-view.svelte';
	import MapSidebar from '$lib/components/common/maps/map-sidebar.svelte';
	import { onMount } from 'svelte';

	let mapView: __esri.MapView | null = $state(null);

	onMount(async () => {
		const [{ default: MapView }] = await Promise.all([import('@arcgis/core/views/MapView')]);
		mapView = new MapView({
			map: {
				basemap: 'streets-vector'
			},
			zoom: 15,
			center: [-90.1928, 38.6226] // longitude, latitude
		});
	});
</script>

{#if mapView}
	<section class="map-layout">
		<MapSidebar {mapView} />
		<MapView {mapView} />
	</section>
{/if}

<style>
	.map-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		position: relative;
	}

	.map-layout :global(.map-sidebar) {
		flex: 0 0 auto;
		width: 100%;
	}

	.map-layout :global(.view) {
		flex: 1 1 auto;
		height: 100%;
		min-height: 0;
	}
</style>
