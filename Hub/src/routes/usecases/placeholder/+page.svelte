<script lang="ts">
	import * as Sidebar from '$lib/components/common/sidebar/index.js';
	import * as SidebarLayout from '$lib/components/common/sidebar-layout/index.js';
	import MapSidebar from '$lib/components/common/usecases/map-sidebar.svelte';
	import { onMount } from 'svelte';

	let mapElement: HTMLArcgisMapElement | null = $state(null);
	let arcgisLayerListComponent: HTMLArcgisLayerListElement | null = $state(null);
	let mapView: __esri.MapView | null = $state(null);
	let isInnerSidebarOpen = $state(false);
	let activeWidget: string | null = $state(null);

	const widgets = [
		{ id: 'layers', label: 'Layers' },
		{ id: 'basemap', label: 'Basemap Gallery' },
		{ id: 'bookmarks', label: 'Bookmarks' },
		{ id: 'analysis', label: 'Analysis' },
		{ id: 'settings', label: 'Map Settings' }
	];

	// Initialize map
	onMount(async () => {
		await import('@arcgis/map-components/components/arcgis-map');
		await import('@arcgis/map-components/components/arcgis-basemap-gallery');
		await import('@arcgis/map-components/components/arcgis-layer-list');
	});

	$effect(() => {
		if (!arcgisLayerListComponent || !mapView) {
			return;
		}

		arcgisLayerListComponent.view = mapView;
		arcgisLayerListComponent.listItemCreatedFunction = (event: any) => {
			const { item } = event;

			// Exclude group layers, otherwise the legend will be displayed twice
			if (item.layer.type != 'group') {
				item.panel = {
					content: 'legend',
					open: true
				};
			}
		};
	});

	function handleViewReady() {
		mapView = mapElement?.view ?? null;

		if (arcgisLayerListComponent && mapView) {
			arcgisLayerListComponent.view = mapView;
		}
	}

	function onToggleInnerSidebarItem(id: string, isActive: boolean) {
		isInnerSidebarOpen = isActive;
		activeWidget = isActive ? id : null;
	}
</script>

<div class="layout">
	{#if mapView}
		<MapSidebar options={widgets} onToggleItem={onToggleInnerSidebarItem} />
	{/if}

	<Sidebar.Root isOpen={isInnerSidebarOpen} hideToggleButton={true}>
		{#snippet sidebarContent()}
			<SidebarLayout.Content>
				<arcgis-layer-list bind:this={arcgisLayerListComponent} hidden={activeWidget !== 'layers'}>
				</arcgis-layer-list>
				<arcgis-basemap-gallery
					hidden={activeWidget !== 'basemap'}
					class="h-full w-full"
					view={mapView}
				></arcgis-basemap-gallery>
			</SidebarLayout.Content>
		{/snippet}

		{#snippet mainContent()}
			<arcgis-map
				bind:this={mapElement}
				class="relative h-full w-full"
				item-id="331ba640fe6c4fa5b4c3d025160c2ec5"
				center="-2.231774828836059,53.46531847221502"
				zoom="15"
				onarcgisViewReadyChange={handleViewReady}
			>
			</arcgis-map>
		{/snippet}
	</Sidebar.Root>
</div>

<style>
	.layout {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: row;
		align-items: stretch;
	}

	.layout :global(.sidebar-layout) {
		flex: 1;
		min-width: 0;
	}
</style>
