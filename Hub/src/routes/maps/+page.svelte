<script lang="ts">
	import MapView from '$lib/components/common/maps/map-view.svelte';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onMount } from 'svelte';
	import CommandSearch from '$lib/components/common/maps/command-search/command-search.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import * as SidebarLayout from '$lib/components/common/sidebar-layout/index.js';
	import AddWebMap from '$lib/components/common/maps/add-web-map.svelte';
	import { asset } from '$app/paths';

	let mapView: __esri.MapView | null = $state(null);
	let commandSearchElement: HTMLElement | null = $state(null);
	let useFetchWebMaps = new UseFetchWebMaps();

	let activeCommandId = $state<string | null>(null);
	let isSidebarOpen = $state(false);

	const webMapsCommand: MapCommand = {
		id: 'add-web-map',
		name: 'Add web map',
		description: 'Fetch and display our web maps.',
		group: 'Maps',
		shortcut: ['Ctrl', 'M'],
		inputPlaceholder: 'Search web maps...',
		execute: async (_runtime) => {
			await useFetchWebMaps.fetchWebMaps(asset(`/maps-web-map.json`));
			activeCommandId = 'show-web-maps';
			isSidebarOpen = true;
		},
		component: AddWebMap as any,
		props: (_runtime) => ({
			mapView,
			inputPlaceholder: webMapsCommand.inputPlaceholder
		})
	};

	const layersCommand: MapCommand = {
		id: 'add-layer',
		name: 'Add layers',
		description: 'Fetch and display our layers.',
		group: 'Maps',
		shortcut: ['Ctrl', 'L'],
		execute: async (_runtime) => {}
	};

	onMount(async () => {
		const [{ default: MapView }] = await Promise.all([import('@arcgis/core/views/MapView')]);
		mapView = new MapView({
			map: {
				basemap: 'streets-vector'
			},
			zoom: 15,
			center: [-90.1928, 38.6226] // longitude, latitude
		});

		mapView.ui.move('zoom', 'bottom-right');

		const [{ default: LayerList }] = await Promise.all([import('@arcgis/core/widgets/LayerList')]);
		const layerList = new LayerList({
			view: mapView
		});

		mapView.ui.add(layerList, {
			position: 'top-left'
		});

		const [{ default: Legend }] = await Promise.all([import('@arcgis/core/widgets/Legend')]);
		const legend = new Legend({
			view: mapView
		});

		mapView.ui.add(legend, {
			position: 'top-right'
		});
	});

	// Add the search bar to the map UI when both are ready
	$effect(() => {
		if (mapView && commandSearchElement) {
			mapView.ui.add(commandSearchElement, {
				position: 'manual'
			});
		}
	});
</script>

<div bind:this={commandSearchElement} class="command-search-wrapper">
	<CommandSearch commands={[webMapsCommand, layersCommand]} />
</div>

{#if mapView}
	<section class="map-layout">
		<MapView {mapView} />
	</section>
{/if}

<style>
	.command-search-wrapper {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1;
	}

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
