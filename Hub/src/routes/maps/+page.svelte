<script lang="ts">
	import MapView from '$lib/components/common/maps/map-view.svelte';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onDestroy, onMount } from 'svelte';
	import CommandSearch from '$lib/components/common/maps/command-search/command-search.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import AddWebMap from '$lib/components/common/maps/add-web-map.svelte';
	import { asset } from '$app/paths';

	let mapView: __esri.MapView | null = $state(null);
	let commandSearchElement: HTMLElement | null = $state(null);
	let useFetchWebMaps = new UseFetchWebMaps();

	let activeCommandId = $state<string | null>(null);

	let mapsWebMapJsonPath: string | null = null;

	let webMapsCommand: MapCommand | null = $state(null);
	let layersCommand: MapCommand | null = $state(null);

	onMount(async () => {
		mapsWebMapJsonPath = asset(`/maps-web-map.json`);

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

		webMapsCommand = createAddWebMapsCommand();
		layersCommand = createAddLayersCommand();
	});

	// Add the search bar to the map UI when both are ready
	$effect(() => {
		if (!mapView || !commandSearchElement) {
			return;
		}

		const view = mapView;
		const element = commandSearchElement;

		view.ui.add(element, {
			position: 'manual'
		});

		return () => {
			view.ui.remove(element);
		};
	});

	onDestroy(() => {
		webMapsCommand = null;
		layersCommand = null;

		if (mapView) {
			mapView.destroy();
		}
	});

	function createAddWebMapsCommand(): MapCommand {
		const command: MapCommand = {
			id: 'add-web-map',
			name: 'Add web map',
			description: 'Fetch and display our web maps.',
			group: 'Maps',
			shortcut: ['Ctrl', 'M'],
			inputPlaceholder: 'Search web maps...',
			execute: async (_runtime) => {
				await useFetchWebMaps.fetchWebMaps(mapsWebMapJsonPath ?? '/maps-web-map.json');
				activeCommandId = 'show-web-maps';
			},
			component: AddWebMap as any,
			props: (_runtime) => ({
				mapView,
				inputPlaceholder: command.inputPlaceholder
			})
		};

		return command;
	}

	function createAddLayersCommand(): MapCommand {
		return {
			id: 'add-layer',
			name: 'Add layers',
			description: 'Fetch and display our layers.',
			group: 'Maps',
			shortcut: ['Ctrl', 'L'],
			execute: async (_runtime) => {}
		};
	}
</script>

{#if webMapsCommand && layersCommand}
	<CommandSearch
		bind:ref={commandSearchElement}
		class="position-absolute top-3 left-1/2 z-1 -translate-x-1/2 transform"
		commands={[webMapsCommand, layersCommand]}
	/>
{/if}

<div class="map-layout">
	{#if mapView}
		<MapView {mapView} />
	{/if}
</div>

<style>
	.map-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		position: relative;
	}
</style>
