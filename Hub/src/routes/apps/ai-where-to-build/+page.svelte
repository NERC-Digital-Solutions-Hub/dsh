<script lang="ts">
	import * as Sidebar from '$lib/components/common/sidebar/index.js';
	import * as SidebarLayout from '$lib/components/common/sidebar-layout/index.js';
	import MapSidebar from '$lib/components/common/usecases/map-sidebar.svelte';
	import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
	import { onMount } from 'svelte';
	import { clipPolygon } from '$lib/tools/map/clip-polygon';
	import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
	import GroupLayer from '@arcgis/core/layers/GroupLayer.js';
	import { mergeClippedPolygons } from '$lib/tools/map/merge-clipped-polygons';
	import Graphic from '@arcgis/core/Graphic.js';
	import { List, Map, Brain } from '@lucide/svelte';

	let mapElement: HTMLArcgisMapElement | null = $state(null);
	let arcgisLayerListComponent: HTMLArcgisLayerListElement | null = $state(null);
	let mapView: __esri.MapView | null = $state(null);
	let isInnerSidebarOpen = $state(false);
	let activeWidget: string | null = $state(null);
	let clipComplete = $state(false);

	const widgets = [
		{ id: 'layers', label: 'Layers', icon: List },
		{ id: 'basemap', label: 'Basemap Gallery', icon: Map },
		{ id: 'analysis', label: 'Analysis', icon: Brain }
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

	async function handleViewReady() {
		mapView = mapElement?.view ?? null;

		if (arcgisLayerListComponent && mapView) {
			arcgisLayerListComponent.view = mapView;
		}

		if (clipComplete) {
			return;
		}
		clipComplete = true;

		if (!mapView || !mapView.map) {
			return;
		}

		const clippedLayer = new GraphicsLayer({
			title: 'Clipped polygons',
			listMode: 'show' // so it appears in LayerList if you use one
		});

		// 1. Create a highlight layer
		const highlightLayer = new GraphicsLayer({ listMode: 'hide' });
		mapView.map.add(highlightLayer);

		// 2. Click handler
		mapView.on('click', async (event) => {
			if (!mapView) {
				return;
			}

			const hit = await mapView.hitTest(event);

			// Only care about polygons from your clippedLayer
			const result = hit.results.find((r) => r.layer === clippedLayer);
			if (!result) {
				highlightLayer.removeAll();
				return;
			}

			const g = (result as __esri.GraphicHit).graphic;

			// 3. Update highlight
			highlightLayer.removeAll();
			highlightLayer.add(
				new Graphic({
					geometry: g.geometry,
					symbol: {
						type: 'simple-fill',
						color: [0, 0, 0, 0], // transparent fill
						outline: {
							type: 'simple-line',
							color: [255, 255, 0, 1], // yellow outline
							width: 3
						}
					}
				})
			);

			// 4. Open popup with the clicked graphic
			mapView.popup?.open({
				features: [g],
				location: event.mapPoint
			});
		});
		await mapView.when();

		mapView.map.add(clippedLayer);

		function flattenedLayers(layers: __esri.Layer[]): __esri.Layer[] {
			const result: __esri.Layer[] = [];
			for (const layer of layers) {
				if (layer instanceof GroupLayer) {
					result.push(...flattenedLayers((layer as __esri.GroupLayer).layers.toArray()));
				} else if (layer instanceof FeatureLayer) {
					result.push(layer);
				}
			}

			return result;
		}

		function colorFromId(id: string, alpha = 0.3) {
			// Simple string hash
			let hash = 0;
			for (let i = 0; i < id.length; i++) {
				hash = id.charCodeAt(i) + ((hash << 5) - hash);
			}

			// Use hash bits to build RGB values
			const r = (hash >> 0) & 0xff;
			const g = (hash >> 8) & 0xff;
			const b = (hash >> 16) & 0xff;

			return [r, g, b, alpha];
		}

		const parcelsLayer = mapView.map.findLayerById('19a9760b651-layer-105') as __esri.FeatureLayer;
		console.log('Parcels Layer:', parcelsLayer.title);

		for (const layer of flattenedLayers(mapView.map.layers.toArray())) {
			if (!(layer instanceof FeatureLayer)) {
				console.log(`Skipping non-feature layer: ${layer.title}, type: ${layer.type}`);
				continue;
			}

			if (layer.id === parcelsLayer.id) {
				console.log(`Skipping parcels layer itself: ${layer.title}`);
				continue;
			}

			const polygon = await clipPolygon({
				view: mapView,
				inputLayer: parcelsLayer,
				polygonId: 4130,
				idField: 'OBJECTID',
				clipLayer: layer,
				targetLayer: clippedLayer
			});

			if (!polygon) {
				console.log(`No polygon clipped for layer: ${layer.title}`);
				continue;
			}

			polygon.attributes ??= {};
			// keep a single title for this polygon
			polygon.attributes.layerTitle = layer.title;
			polygon.attributes.layerId = layer.id;
			// also a list (will be useful when merging)
			polygon.attributes.layerTitles = [layer.title];

			const id = layer.id;
			polygon.symbol = {
				type: 'simple-fill',
				color: colorFromId(id, 0.3),
				outline: {
					color: [255, 0, 0, 1],
					width: 2
				}
			};

			console.log('Clipped Polygon:', polygon);
		}

		console.log('Merging clipped polygons in layer:', clippedLayer.id);
		const mergedPolygons = mergeClippedPolygons(clippedLayer);
		for (const graphic of mergedPolygons) {
			const key = graphic.attributes.layerTitles.join('; ');
			graphic.symbol = {
				type: 'simple-fill',
				color: colorFromId(key, 0.3),
				outline: {
					color: [0, 0, 0, 1],
					width: 1
				}
			};

			graphic.popupTemplate = {
				title: 'Clipped region',
				content: [
					{
						type: 'custom',
						creator: (event: __esri.PopupTemplateCreatorEvent) => {
							const graphic = event.graphic;
							const titles: string[] = graphic.attributes.layerTitles ?? [];

							const table = document.createElement('table');
							table.className = 'esri-widget__table';

							const tbody = document.createElement('tbody');
							titles.forEach((t) => {
								const tr = document.createElement('tr');
								const td = document.createElement('td');
								td.textContent = t;
								tr.appendChild(td);
								tbody.appendChild(tr);
							});

							table.appendChild(tbody);
							return table;
						}
					}
				]
			};
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
				<div class="basemap-container" hidden={activeWidget !== 'basemap'}>
					<arcgis-basemap-gallery class="basemap-gallery" view={mapView}></arcgis-basemap-gallery>
				</div>
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
		overflow: hidden;
	}

	.layout :global(.sidebar-layout) {
		flex: 1;
		min-width: 0;
		height: 100%;
	}

	.basemap-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.basemap-gallery {
		width: 100%;
		height: 100%;
		overflow: auto;
	}
</style>
