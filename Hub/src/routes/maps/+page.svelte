<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import CommandSearch from '$lib/components/common/maps/command-search/command-search.svelte';
	import type { MapCommand } from '$lib/types/maps';
	import AddWebMap from '$lib/components/common/maps/add-web-map.svelte';
	import AddOrganisation from '$lib/components/common/maps/add-organisation.svelte';
	import { asset } from '$app/paths';
	import { browser } from '$app/environment';
	import { CommandSearchContext } from '$lib/services/command-search/command-search-context';
	import { MapsConfig } from '$lib/models/maps-config';

	const commandSearchContext = new CommandSearchContext();

	let mapView: __esri.MapView | null = $state(null);
	let commandSearchElement: HTMLElement | null = $state(null);

	let arcgisMapComponent: HTMLArcgisMapElement | null = $state(null);

	let webMapsCommand: MapCommand | null = $state(null);
	let layersCommand: MapCommand | null = $state(null);
	let organisationsCommand: MapCommand | null = $state(null);

	onMount(async () => {
		if (!browser) {
			return;
		}

		const mapsConfig = await getMapsConfig();
		commandSearchContext.add(MapsConfig, mapsConfig);

		await mountArcGisComponents();

		webMapsCommand = createAddWebMapsCommand();
		layersCommand = createAddLayersCommand();
		organisationsCommand = createAddOrganisationsCommand();
	});

	async function getMapsConfig(): Promise<MapsConfig> {
		const response = await fetch(asset('/config/maps/config.json'));
		if (!response.ok) {
			throw new Error(`Failed to load maps config: ${response.status} ${response.statusText}`);
		}

		const config: any = await response.json();

		const instance = new MapsConfig(config.organisations);
		return instance;
	}

	function handleViewReady() {
		if (!arcgisMapComponent) {
			return;
		}

		mapView = arcgisMapComponent.view as __esri.MapView;
	}

	async function mountArcGisComponents() {
		if (!browser) {
			return;
		}

		await import('@arcgis/map-components/components/arcgis-layer-list');
		await import('@arcgis/map-components/components/arcgis-legend');
		await import('@arcgis/map-components/components/arcgis-map');
	}

	onDestroy(() => {
		webMapsCommand = null;
		layersCommand = null;
		organisationsCommand = null;
	});

	function createAddWebMapsCommand(): MapCommand {
		const command: MapCommand = {
			id: 'add-web-map',
			name: 'Add web map',
			description: 'Fetch and display our web maps.',
			group: 'Maps',
			shortcut: ['Ctrl', 'M'],
			inputPlaceholder: 'Search web maps...',
			execute: async (_runtime) => {},
			component: AddWebMap as any,
			props: (_runtime) => ({
				commandSearchContext,
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

	function createAddOrganisationsCommand(): MapCommand {
		return {
			id: 'add-organisation',
			name: 'Add organisation',
			description: 'Find and add an organisation to filter items by.',
			group: 'Maps',
			shortcut: ['Ctrl', 'O'],
			inputPlaceholder: 'Search organisations...',
			component: AddOrganisation as any,
			execute: async (_runtime) => {},
			props: (_runtime) => ({
				commandSearchContext,
				inputPlaceholder: 'Search organisations...'
			})
		};
	}
</script>

<arcgis-map
	bind:this={arcgisMapComponent}
	class="relative h-full w-full"
	basemap="gray"
	center="-2.231774828836059,53.46531847221502"
	zoom="15"
	onarcgisViewReadyChange={handleViewReady}
>
	{#if webMapsCommand && layersCommand && organisationsCommand}
		<div id="search-slot" class="absolute top-3 left-1/2 z-10 -translate-x-1/2">
			<CommandSearch
				bind:ref={commandSearchElement}
				class="w-full max-w-md"
				commands={[webMapsCommand, layersCommand, organisationsCommand]}
			/>
		</div>
	{/if}
	<arcgis-layer-list position="top-left"></arcgis-layer-list>
	<arcgis-legend position="top-right"></arcgis-legend>
</arcgis-map>
