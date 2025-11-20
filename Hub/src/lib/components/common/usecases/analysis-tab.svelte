<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { addGraphicLayer } from '$lib/services/apps/ai-where-to-build/add-graphic-layer';
	import { LayerViewProvider } from '$lib/services/layer-view-provider';
	import { AreaSelectionInteractionStore } from '$lib/stores/services/uprn2/area-selection-interaction-store.svelte';
	import { AreaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import { MapInteractionStore } from '$lib/stores/services/uprn2/map-interaction-store.svelte';
	import { clipPolygon } from '$lib/tools/map/clip-polygon';
	import { mergeClippedPolygons } from '$lib/tools/map/merge-clipped-polygons';
	import { queryPolygonFieldValue } from '$lib/tools/map/query-polygon-field-value';
	import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
	import GroupLayer from '@arcgis/core/layers/GroupLayer';
	import { onMount } from 'svelte';

	type Props = {
		mapView: __esri.MapView;
	};

	const { mapView }: Props = $props();

	let areaSelectionStore: AreaSelectionStore | null = $state(null);
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $state(null);
	let mapInteractionStore: MapInteractionStore | null = $state(null);
	let graphicLayer: __esri.GraphicsLayer | null = $state(null);
	let lastAnalyzedPolygonsKey: string | null = $state(null);

	const DEFAULT_WARD_LAYER_TITLE = 'UK Wards (Boundary Fully Clipped) (2022)';

	onMount(async () => {
		graphicLayer = addGraphicLayer(mapView, 'Analysis Results Layer');
		await initializeStores();
		setDefaultAreaLayer();
	});

	/**
	 * Initializes all required stores for area selection and map interaction.
	 * Creates and configures AreaSelectionStore, AreaSelectionInteractionStore, and MapInteractionStore.
	 *
	 * @throws {Error} If MapView is not initialized
	 */
	async function initializeStores() {
		if (!mapView) {
			throw new Error('[analysis-tab] MapView is not initialized');
		}

		areaSelectionStore = new AreaSelectionStore();
		areaSelectionInteractionStore = new AreaSelectionInteractionStore(
			areaSelectionStore,
			new LayerViewProvider(mapView)
		);

		mapInteractionStore = new MapInteractionStore(
			mapView,
			areaSelectionInteractionStore,
			new Set([DEFAULT_WARD_LAYER_TITLE]) // TODO: Move to config
		);

		console.log('[analysis-tab] Initialized stores', areaSelectionStore.layerId);

		await areaSelectionInteractionStore.refreshLayerView();
		await areaSelectionInteractionStore.refreshAreas();
	}

	/**
	 * Sets the default area layer for analysis to the UK Wards layer.
	 * Searches for the layer in the map and updates the area selection store with its ID.
	 */
	function setDefaultAreaLayer() {
		if (!areaSelectionStore) {
			console.warn('[analysis-tab] AreaSelectionStore not initialized yet');
			return;
		}

		const layer = mapView.map?.allLayers.find((layer) => layer.title === DEFAULT_WARD_LAYER_TITLE);

		if (layer) {
			areaSelectionStore.setLayerId(layer.uid);
			console.log(`[analysis-tab] Set default area layer to ID: ${layer.uid}`);
		} else {
			console.warn('[analysis-tab] Default area layer not found on the map');
		}
	}

	/**
	 * Recursively flattens a collection of map layers, extracting all feature layers
	 * from group layers and individual feature layers.
	 *
	 * @param layers - Array of map layers to flatten
	 * @returns Array of flattened feature layers
	 */
	function flattenLayers(layers: __esri.Layer[]): __esri.Layer[] {
		const result: __esri.Layer[] = [];
		for (const layer of layers) {
			if (layer instanceof GroupLayer) {
				result.push(...flattenLayers((layer as __esri.GroupLayer).layers.toArray()));
			} else if (layer instanceof FeatureLayer) {
				result.push(layer);
			}
		}
		return result;
	}

	/**
	 * Generates a consistent color based on a string ID using hash-based color generation.
	 *
	 * @param id - String identifier to generate color from
	 * @param alpha - Opacity value (0-1), defaults to 0.3
	 * @returns RGBA color array [r, g, b, alpha]
	 */
	function generateColorFromId(id: string, alpha = 0.3): number[] {
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

	/**
	 * Creates a simple fill symbol with color and outline for a polygon graphic.
	 *
	 * @param colorId - String identifier used to generate the fill color
	 * @param alpha - Opacity for the fill color
	 * @param outlineColor - RGBA array for the outline color
	 * @param outlineWidth - Width of the outline in pixels
	 * @returns Object containing symbol properties for ArcGIS SimpleFillSymbol
	 */
	function createFillSymbol(
		colorId: string,
		alpha: number = 0.3,
		outlineColor: number[] = [255, 0, 0, 1],
		outlineWidth: number = 2
	) {
		return {
			type: 'simple-fill' as const,
			color: generateColorFromId(colorId, alpha),
			outline: {
				color: outlineColor,
				width: outlineWidth
			}
		};
	}

	/**
	 * Creates a popup template for displaying clipped polygon information in a table format.
	 *
	 * @returns Object containing popup template properties for ArcGIS PopupTemplate
	 */
	function createPopupTemplate() {
		return {
			title: 'Clipped region',
			content: [
				{
					type: 'custom',
					creator: (event: __esri.PopupTemplateCreatorEvent) => {
						const graphic = event.graphic;
						const titles: string[] = graphic.attributes.layerTitles ?? [];
						const values: string[] = graphic.attributes.layerValues ?? [];

						const table = document.createElement('table');
						table.className = 'esri-widget__table';

						const tbody = document.createElement('tbody');

						// Header row
						const headerRow = document.createElement('tr');
						const thLayer = document.createElement('th');
						const thValue = document.createElement('th');
						thLayer.textContent = 'Layer';
						thValue.textContent = 'Value';
						headerRow.appendChild(thLayer);
						headerRow.appendChild(thValue);
						tbody.appendChild(headerRow);

						// Data rows
						titles.forEach((title, idx) => {
							const tr = document.createElement('tr');

							const tdTitle = document.createElement('td');
							tdTitle.textContent = title;

							const tdValue = document.createElement('td');
							tdValue.textContent = values[idx] ?? '';

							tr.appendChild(tdTitle);
							tr.appendChild(tdValue);
							tbody.appendChild(tr);
						});

						table.appendChild(tbody);
						return table;
					}
				}
			]
		};
	}

	/**
	 * Validates that all required components are initialized before analysis.
	 *
	 * @returns True if all components are ready, false otherwise
	 */
	function validateComponentsReady(): boolean {
		if (!mapView || !mapView.map) {
			console.warn('[analysis-tab] MapView not initialized yet');
			return false;
		}

		if (!areaSelectionStore || !areaSelectionInteractionStore || !mapInteractionStore) {
			console.warn('[analysis-tab] Stores not initialized yet');
			return false;
		}

		if (!graphicLayer) {
			console.warn('[analysis-tab] Graphic layer not initialized yet');
			return false;
		}

		return true;
	}

	/**
	 * Retrieves the parcels layer from the map.
	 *
	 * @returns The parcels feature layer or null if not found
	 */
	function getParcelsLayer(): __esri.FeatureLayer | null {
		const parcelsLayer = mapView.map!.findLayerById('19a9760b651-layer-105') as __esri.FeatureLayer;
		if (parcelsLayer) {
			console.log('Parcels Layer:', parcelsLayer.title);
		}
		return parcelsLayer;
	}

	/**
	 * Processes and clips a single feature layer against the parcels layer.
	 *
	 * @param layer - The feature layer to clip
	 * @param parcelsLayer - The parcels layer to clip against
	 * @param selectedObjectId - The object ID of the selected parcel
	 */
	async function processFeatureLayer(
		layer: __esri.FeatureLayer,
		parcelsLayer: __esri.FeatureLayer,
		selectedObjectId: number
	): Promise<void> {
		const polygon = await clipPolygon({
			view: mapView,
			inputLayer: parcelsLayer,
			polygonId: selectedObjectId,
			idField: 'OBJECTID',
			clipLayer: layer,
			targetLayer: graphicLayer!
		});

		if (!polygon) {
			console.log(`No polygon clipped for layer: ${layer.title}`);
			return;
		}

		polygon.attributes ??= {};
		polygon.attributes.layerTitle = layer.title;
		polygon.attributes.layerId = layer.id;

		if (layer.displayField) {
			polygon.attributes.value = await queryPolygonFieldValue(layer, polygon, layer.displayField);
		}

		polygon.attributes.layerTitles = [layer.title];
		polygon.symbol = createFillSymbol(layer.id, 0.3, [255, 0, 0, 1], 2);

		console.log('Clipped Polygon:', polygon);
	}

	/**
	 * Applies styling and popup templates to merged polygon graphics.
	 *
	 * @param mergedPolygons - Array of merged polygon graphics
	 */
	function styleMergedPolygons(mergedPolygons: __esri.Graphic[]): void {
		for (const graphic of mergedPolygons) {
			const key = graphic.attributes.layerTitles.join('; ');
			graphic.symbol = createFillSymbol(key, 0.3, [0, 0, 0, 1], 1);
			graphic.popupTemplate = createPopupTemplate();
		}
	}

	/**
	 * Main analysis handler. Clips all feature layers against the selected parcel area
	 * and displays the results on the map.
	 */
	async function onAnalyze() {
		if (!validateComponentsReady()) {
			return;
		}

		const selectedObjectIds = getSelectionObjectIds();
		if (selectedObjectIds.length === 0) {
			console.warn('[analysis-tab] No area selected for analysis');
			return;
		}

		if (lastAnalyzedPolygonsKey === `analyzed-${selectedObjectIds.join('-')}`) {
			console.log('[analysis-tab] Analysis already performed for the selected area(s)');
			return;
		}

		const parcelsLayer = getParcelsLayer();
		if (!parcelsLayer) {
			console.warn('[analysis-tab] Parcels layer not found');
			return;
		}

		const allLayers = flattenLayers(mapView.map!.layers.toArray());

		for (const layer of allLayers) {
			if (!(layer instanceof FeatureLayer)) {
				console.log(`Skipping non-feature layer: ${layer.title}, type: ${layer.type}`);
				continue;
			}

			if (layer.id === parcelsLayer.id) {
				console.log(`Skipping parcels layer itself: ${layer.title}`);
				continue;
			}

			await processFeatureLayer(layer as __esri.FeatureLayer, parcelsLayer, selectedObjectIds[0]);
		}

		console.log('Merging clipped polygons in layer:', graphicLayer!.id);
		const mergedPolygons = mergeClippedPolygons(graphicLayer!);
		styleMergedPolygons(mergedPolygons);

		areaSelectionStore?.clearSelectedAreas();
		await areaSelectionInteractionStore?.refreshAreas();
		areaSelectionInteractionStore?.clearSelections();

		lastAnalyzedPolygonsKey = `analyzed-${selectedObjectIds.join('-')}`;
	}

	/**
	 * Retrieves the currently selected area object IDs from the area selection store.
	 *
	 * @returns Array of selected object IDs, or empty array if stores not initialized
	 */
	function getSelectionObjectIds(): number[] {
		if (!areaSelectionInteractionStore || !areaSelectionStore) {
			return [];
		}

		return Array.from(areaSelectionStore.selectedAreaIds);
	}
</script>

<p>
	This is the Analysis Tab component. This is where the user and initiate analysis for a polygon or
	area (e.g. Ward).
</p>

<Button onclick={onAnalyze}>Analyze</Button>
