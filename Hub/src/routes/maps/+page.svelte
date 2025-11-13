<script lang="ts">
	import MapView from '$lib/components/common/maps/map-view.svelte';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onDestroy, onMount } from 'svelte';
	import CommandSearch from '$lib/components/common/maps/command-search/command-search.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import AddWebMap from '$lib/components/common/maps/add-web-map.svelte';
	import { asset } from '$app/paths';
	import { browser } from '$app/environment';

	let mapView: __esri.MapView | null = $state(null);
	let commandSearchElement: HTMLElement | null = $state(null);
	let commandSearchAdded: boolean = $state(false);

	let activeCommandId = $state<string | null>(null);

	let webMapsCommand: MapCommand | null = $state(null);
	let layersCommand: MapCommand | null = $state(null);

	onMount(async () => {
		if (!browser) {
			return;
		}

		await mountArcGisComponents();

		const [{ default: MapView }] = await Promise.all([import('@arcgis/core/views/MapView')]);
		mapView = new MapView({
			map: {
				basemap: 'gray'
			},
			zoom: 15,
			center: [-2.231774828836059, 53.46531847221502], // longitude, latitude
			background: {
				color: [207, 211, 212]
			}
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

	async function mountArcGisComponents() {
		if (!browser) {
			return;
		}

		await import('@arcgis/map-components/components/arcgis-layer-list');
		await import('@arcgis/map-components/components/arcgis-map');
	}

	// Add the search bar to the map UI when both are ready
	$effect(() => {
		if (commandSearchAdded || !mapView || !commandSearchElement) {
			return;
		}

		const view = mapView;
		const element = commandSearchElement;

		view.ui.add(element, {
			position: 'manual'
		});

		commandSearchAdded = true;
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

<arcgis-layer-list> </arcgis-layer-list>

{#if mapView}
	<div class="map-layout">
		<MapView {mapView} />
	</div>
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
</style>
