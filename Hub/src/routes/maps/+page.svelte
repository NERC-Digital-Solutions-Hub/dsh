<script lang="ts">
	import MapView from '$lib/components/common/maps/map-view.svelte';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onMount } from 'svelte';
	import CommandSearch from '$lib/components/common/maps/command-search/command-search.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import * as Sidebar from '$lib/components/common/sidebar/index.js';
	import * as SidebarLayout from '$lib/components/common/sidebar-layout/index.js';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import * as Card from '$lib/components/ui/card/index.js';

	import { Car } from 'lucide-svelte';
	import AddWebMap from '$lib/components/common/maps/add-web-map.svelte';

	let mapView: __esri.MapView | null = $state(null);
	let commandSearchElement: HTMLElement | null = $state(null);
	let useFetchWebMaps = new UseFetchWebMaps();

	let activeCommandId = $state<string | null>(null);
	let isSidebarOpen = $state(false);

	const webMapsCommand: MapCommand = {
		id: 'show-web-maps',
		name: 'Show available web maps',
		description: 'Fetch and display our web maps.',
		group: 'Maps',
		shortcut: ['Ctrl', 'M'],
		execute: async () => {
			await useFetchWebMaps.fetchWebMaps('/maps-web-map.json');
			activeCommandId = 'show-web-maps';
			isSidebarOpen = true;
		},
		component: AddWebMap,
		props: () => ({
			mapView
		})
	};

	const layersCommand: MapCommand = {
		id: 'show-layers',
		name: 'Show available layers',
		description: 'Fetch and display our layers.',
		group: 'Maps',
		shortcut: ['Ctrl', 'L'],
		execute: async () => {},
		component: null!,
		props: null!
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
			position: 'top-right'
		});
	});

	// Add the search bar to the map UI when both are ready
	$effect(() => {
		if (mapView && commandSearchElement) {
			mapView.ui.add(commandSearchElement, {
				position: 'top-left'
			});
		}
	});
</script>

<div bind:this={commandSearchElement}>
	<CommandSearch commands={[webMapsCommand, layersCommand]} />
</div>

{#if activeCommandId === 'show-web-maps'}
	{console.log('Web maps command is active')}
	<SidebarLayout.Content></SidebarLayout.Content>
{/if}

{#if mapView}
	<section class="map-layout">
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
