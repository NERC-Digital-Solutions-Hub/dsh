<script lang="ts">
	import { onDestroy, mount, unmount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { Spinner } from '$lib/Components/shadcn/spinner';
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
	import { TabType } from '$lib/Types/Uprn.types';

	import type MapView from '@arcgis/core/views/MapView';
	import type SearchWidget from '@arcgis/core/widgets/Search';
	import type Legend from '@arcgis/core/widgets/Legend';
	import type Expand from '@arcgis/core/widgets/Expand';

	import LocatorSearchSource from '@arcgis/core/widgets/Search/LocatorSearchSource.js';
	import PopupTemplate from '@arcgis/core/PopupTemplate.js';
	import * as identify from '@arcgis/core/rest/identify.js';
	import IdentifyParameters from '@arcgis/core/rest/support/IdentifyParameters.js';
	import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js';

	/**
	 * Props accepted by the map view component.
	 */
	type Props = {
		/**
		 * The web map to render in the provided ArcGIS MapView.
		 * When undefined or null, the component will not attempt to update the map.
		 */
		webMap?: __esri.WebMap | null;

		/**
		 * The ArcGIS MapView instance managed by a parent component.
		 */
		mapView: MapView;

		/**
		 * Store responsible for area selection state and related map interactions.
		 */
		areaSelectionInteractionStore: AreaSelectionInteractionStore;

		/**
		 * IDs of layers that should be treated as interactable for area selection.
		 */
		interactableLayers: SvelteSet<string>;

		/**
		 * Currently active application tab.
		 */
		currentTab: TabType;
	};

	const { webMap, mapView, areaSelectionInteractionStore, interactableLayers, currentTab }: Props =
		$props();

	const MAP_BACKGROUND = '#CFD3D4';
	const FALLBACK_BASEMAP = 'streets-vector';
	const SEARCH_PLACEHOLDER = 'Search UK locations';
	const SEARCH_URL = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
	const SEARCH_COUNTRY_CODE = 'GB';
	const MAP_ZOOM_CONSTRAINTS = {
		minZoom: 4,
		maxZoom: 17
	} as const;

	let mapContainer: HTMLDivElement | null = null;

	let mapInteractionStore: MapInteractionStore | null = null;
	let searchWidget: SearchWidget | null = null;
	let legendWidget: Legend | null = null;
	let legendExpand: Expand | null = null;
	let mapLoadingHandle: __esri.WatchHandle | null = null;

	let searchRowEl: HTMLDivElement | null = null;
	let spinnerSlotEl: HTMLDivElement | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let spinnerInstance: any = null;

	/**
	 * Creates a layer view provider for the current map view.
	 *
	 * @throws {Error} When the map view is unavailable.
	 */
	export function getLayerViewProvider(): LayerViewProvider {
		if (!mapView) {
			throw new Error('MapView is not initialized');
		}

		return new LayerViewProvider(mapView);
	}

	/**
	 * Creates a fallback ArcGIS Map instance to be used when a WebMap cannot be loaded.
	 */
	async function createFallbackMap(): Promise<__esri.Map> {
		const { default: Map } = await import('@arcgis/core/Map');

		return new Map({
			basemap: FALLBACK_BASEMAP
		});
	}

	/**
	 * Applies common, one-time view configuration.
	 */
	function configureMapView(): void {
		mapView.container = mapContainer;
		mapView.background = { color: MAP_BACKGROUND };
		mapView.popupEnabled = false;
		mapView.ui.move('zoom', 'bottom-left');
		mapView.constraints = {
			...mapView.constraints,
			...MAP_ZOOM_CONSTRAINTS
		};

		configurePopupDocking();
	}

	/**
	 * Configures popup docking behavior for small-screen-friendly placement.
	 */
	function configurePopupDocking(): void {
		if (!mapView.popup) {
			return;
		}

		mapView.popup.dockEnabled = true;
		mapView.popup.dockOptions = {
			position: 'bottom-right',
			breakpoint: false
		};
	}

	/**
	 * Attaches a WebMap to the current MapView and configures map UI/state.
	 */
	async function updateMapWithWebMap(): Promise<void> {
		if (!webMap || !mapContainer) {
			return;
		}

		try {
			mapView.map = webMap;
			configureMapView();
			setupMapLoadingWatcher();

			await ensureSearchWidget();
			await ensureLegendWidget();
			await areaSelectionInteractionStore.refreshLayerView();
			await areaSelectionInteractionStore.refreshAreas();

			//applyTabInteractionMode(currentTab, interactableLayers);
			console.log('[uprn-map-view] MapView updated with new webMap');
		} catch (error) {
			console.error('Error updating MapView with new webMap:', error);
			await loadFallbackMap();
		}
	}

	/**
	 * Loads a fallback basemap into the current MapView when the main web map cannot be shown.
	 */
	async function loadFallbackMap(): Promise<void> {
		try {
			const fallbackMap = await createFallbackMap();

			mapView.map = fallbackMap;
			configureMapView();
			await mapView.when();

			console.log('[uprn-map-view] Fallback map loaded');
		} catch (fallbackError) {
			console.error('Error loading fallback map:', fallbackError);
		}
	}

	/**
	 * Creates and adds the search widget once, placing it to the right of a spinner slot
	 * inside a shared flex-row container added to the ArcGIS top-right UI.
	 */
	async function ensureSearchWidget(): Promise<void> {
		if (searchWidget) {
			return;
		}

		const { default: Search } = await import('@arcgis/core/widgets/Search');

		const ukSource = new LocatorSearchSource({
			url: SEARCH_URL,
			countryCode: SEARCH_COUNTRY_CODE,
			placeholder: SEARCH_PLACEHOLDER
		});

		// Flex row container that holds [spinner | search]
		searchRowEl = document.createElement('div');
		searchRowEl.style.cssText =
			'display: flex; flex-direction: row; align-items: center; gap: 6px;';

		// Spinner slot – hidden until the map is loading
		spinnerSlotEl = document.createElement('div');
		spinnerSlotEl.style.cssText = 'display: none; align-items: center;';
		spinnerInstance = mount(Spinner, { target: spinnerSlotEl, props: { class: 'size-5' } });
		searchRowEl.appendChild(spinnerSlotEl);

		// Search widget container
		const searchContainerEl = document.createElement('div');
		searchRowEl.appendChild(searchContainerEl);

		searchWidget = new Search({
			view: mapView,
			container: searchContainerEl,
			popupEnabled: false,
			includeDefaultSources: false,
			sources: [ukSource]
		});

		mapView.ui.add(searchRowEl, 'top-right');
	}

	/**
	 * Creates and adds the legend widget once.
	 */
	async function ensureLegendWidget(): Promise<void> {
		if (legendWidget || legendExpand) {
			return;
		}

		const [{ default: Legend }, { default: Expand }] = await Promise.all([
			import('@arcgis/core/widgets/Legend'),
			import('@arcgis/core/widgets/Expand')
		]);

		legendWidget = new Legend({ view: mapView });
		legendExpand = new Expand({
			view: mapView,
			content: legendWidget,
			expandTooltip: 'Legend'
		});

		mapView.ui.add(legendExpand, 'top-right');
	}

	/**
	 * Creates or recreates the map interaction store for the current inputs.
	 * Stateful objects are managed explicitly instead of reactively constructing them in `$derived`.
	 */
	function initialiseMapInteractionStore(): void {
		mapInteractionStore?.cleanup();

		mapInteractionStore = new MapInteractionStore(
			mapView,
			areaSelectionInteractionStore,
			interactableLayers
		);
	}

	/**
	 * Applies interaction mode based on the current active tab.
	 *
	 * Area of Interest tab:
	 * - area selection interaction enabled
	 * - popups disabled
	 *
	 * Other tabs:
	 * - area selection interaction disabled
	 * - popups enabled
	 */
	function applyTabInteractionMode(tab: TabType, layers: SvelteSet<string>) {
		if (!mapView.map || !mapInteractionStore) {
			return;
		}

		const isAreaTab = tab === TabType.AreaOfInterest;
		mapInteractionStore.updateInteractableLayers(isAreaTab ? layers : new SvelteSet());

		if (isAreaTab) {
			mapView.popupEnabled = false;
			if (mapView.popup?.visible) {
				mapView.popup.close();
			}
		} else {
			mapView.popupEnabled = true;
			areaSelectionInteractionStore.clearHoveredArea();
		}

		for (const layer of mapView.map.allLayers.toArray()) {
			configureLayerPopupsAndLegend(layer);
		}
	}

	/**
	 * Configures popup and legend behavior for a layer and its descendants.
	 *
	 * Rules:
	 * - interactable layers never show popups and are hidden from the legend
	 * - non-interactable feature layers get a generated field-based popup
	 * - raster cell layers get a custom identify-driven popup
	 */
	function configureLayerPopupsAndLegend(layer: __esri.Layer | __esri.Sublayer): void {
		const id = String(layer.id);
		const title = layer.title?.toLowerCase() ?? '';
		const isInteractable = interactableLayers.has(id);
		const isRasterCellsLayer = title.includes('raster cells');

		if (isRasterCellsLayer) {
			if ('legendEnabled' in layer) {
				layer.legendEnabled = false;
			}
			if ('popupEnabled' in layer) {
				layer.popupEnabled = true;
				layer.popupTemplate = createRasterCellsPopupTemplate();
			}
		} else if (isInteractable) {
			if ('popupEnabled' in layer) {
				layer.popupEnabled = false;
			}
			if ('legendEnabled' in layer) {
				layer.legendEnabled = false;
			}
		} else if (layer.type === 'feature') {
			const featureLayer = layer as __esri.FeatureLayer;
			featureLayer.popupEnabled = true;
			featureLayer.popupTemplate = createFeatureLayerPopupTemplate(featureLayer);
		}

		if (layer.type === 'group') {
			for (const childLayer of (layer as __esri.GroupLayer).layers.toArray()) {
				configureLayerPopupsAndLegend(childLayer);
			}
		}

		if (layer.type === 'map-image') {
			for (const sublayer of (layer as __esri.MapImageLayer).allSublayers.toArray()) {
				configureLayerPopupsAndLegend(sublayer);
			}
		}
	}

	/**
	 * Creates a popup template for raster cell features.
	 * The popup performs an identify request against the active visible raster sublayer.
	 */
	function createRasterCellsPopupTemplate(): __esri.PopupTemplate {
		return new PopupTemplate({
			title: 'Cell {gridcode}',
			outFields: ['*'],
			content: async ({ graphic }: { graphic: __esri.Graphic }) => {
				const gridcode = graphic.attributes.gridcode;
				const activeRaster = getActiveRasterSublayer();

				if (!activeRaster) {
					return `
						<b>Gridcode:</b> ${gridcode}<br>
						No active raster layer.
					`;
				}

				const center = graphic.geometry?.extent?.center;
				if (!center) {
					return `
						<b>Gridcode:</b> ${gridcode}<br>
						No geometry center available.
					`;
				}

				const params = new IdentifyParameters({
					geometry: center,
					tolerance: 1,
					mapExtent: mapView.extent,
					width: mapView.width,
					height: mapView.height,
					dpi: 96,
					returnGeometry: false,
					layerOption: 'visible',
					layerIds: [activeRaster.id],
					spatialReference: mapView.spatialReference
				});

				try {
					const response = await identify.identify(activeRaster.mapServiceUrl, params);
					const hit = response.results?.[0];

					if (!hit) {
						return `
							<b>Gridcode:</b> ${gridcode}<br>
							No raster value found.
						`;
					}

					const attrs = (hit.feature?.attributes ?? {}) as Record<string, unknown>;
					const valueField = findBestRasterValueField(attrs);
					const fixedValue = Number(attrs[valueField ?? '']).toFixed(3);

					return `
						<b>Gridcode:</b> ${gridcode}<br>
						<b>Value:</b> ${valueField ? fixedValue : 'N/A'}
					`;
				} catch (error) {
					console.error('Identify failed', error);
					return `
						<b>Gridcode:</b> ${gridcode}<br>
						Failed to identify raster value.
					`;
				}
			}
		});
	}

	/**
	 * Returns the most relevant field name for displaying a raster identify value.
	 */
	function findBestRasterValueField(attributes: Record<string, unknown>): string | undefined {
		const keys = Object.keys(attributes);

		return (
			keys.find((key) => key.includes('Value')) ??
			keys.find((key) => key.includes('value')) ??
			Object.entries(attributes).find(([, value]) => isNumericValue(value))?.[0]
		);
	}

	/**
	 * Finds the currently visible raster sublayer from the active map structure.
	 */
	function getActiveRasterSublayer(): {
		id: number;
		title: string;
		mapServiceUrl: string;
	} | null {
		if (!mapView.map) {
			return null;
		}

		return findActiveRasterInLayers(mapView.map.layers);
	}

	/**
	 * Recursively searches layer collections for the first visible raster-capable map-image sublayer.
	 */
	function findActiveRasterInLayers(layers: __esri.Collection<__esri.Layer>): {
		id: number;
		title: string;
		mapServiceUrl: string;
	} | null {
		for (const layer of layers.toArray()) {
			if (!layer.visible) {
				continue;
			}

			if (layer.type === 'map-image') {
				const mapImageLayer = layer as __esri.MapImageLayer;
				const visibleSublayer = mapImageLayer.allSublayers.find((sublayer) => sublayer.visible);

				if (visibleSublayer) {
					return {
						id: visibleSublayer.id,
						title: visibleSublayer.title ?? 'Unnamed Layer',
						mapServiceUrl: mapImageLayer.url ?? 'Unknown URL'
					};
				}
			}

			if ('layers' in layer && layer.layers) {
				const found = findActiveRasterInLayers(layer.layers as __esri.Collection<__esri.Layer>);
				if (found) {
					return found;
				}
			}
		}

		return null;
	}

	/**
	 * Determines whether a value can be safely treated as numeric.
	 */
	function isNumericValue(value: unknown): boolean {
		if (typeof value === 'number') {
			return Number.isFinite(value);
		}

		if (typeof value === 'string') {
			const trimmed = value.trim();
			return trimmed !== '' && !Number.isNaN(Number(trimmed));
		}

		return false;
	}

	/**
	 * Returns true when the ArcGIS field type is a floating point numeric type.
	 */
	function isFloatingNumericFieldType(type: string): boolean {
		return type === 'single' || type === 'double';
	}

	/**
	 * Creates a readable popup template for feature layers by using visible, non-system fields.
	 */
	function createFeatureLayerPopupTemplate(layer: __esri.FeatureLayer): __esri.PopupTemplate {
		const hiddenFieldTypes = new Set([
			'oid',
			'global-id',
			'guid',
			'geometry',
			'blob',
			'raster',
			'xml'
		]);

		const fieldInfos: __esri.FieldInfo[] = layer.fields
			.filter((field) => !hiddenFieldTypes.has(field.type))
			.map((field) => {
				const info: __esri.FieldInfo = {
					fieldName: field.name,
					label: field.alias || field.name,
					visible: true
				} as __esri.FieldInfo;

				if (isFloatingNumericFieldType(field.type)) {
					info.format = {
						digitSeparator: true,
						places: 3
					};
				}

				return info;
			});

		return new PopupTemplate({
			title: layer.title ?? '{OBJECTID}',
			outFields: ['*'],
			content: [
				{
					type: 'fields',
					fieldInfos
				}
			]
		});
	}

	/**
	 * Watches `mapView.updating` to show/hide the spinner slot in the ArcGIS UI.
	 */
	function setupMapLoadingWatcher(): void {
		mapLoadingHandle?.remove();

		mapLoadingHandle = reactiveUtils.watch(
			() => mapView.updating,
			(updating) => {
				if (spinnerSlotEl) {
					spinnerSlotEl.style.display = updating ? 'flex' : 'none';
				}
			},
			{ initial: true }
		);
	}

	/**
	 * Removes the map loading watcher and hides the spinner slot.
	 */
	function cleanupMapLoadingWatcher(): void {
		mapLoadingHandle?.remove();
		mapLoadingHandle = null;
		if (spinnerSlotEl) {
			spinnerSlotEl.style.display = 'none';
		}
	}

	/**
	 * Removes widgets and local subscriptions created by this component.
	 *
	 * Note:
	 * The MapView instance is passed in as a prop, so this component does not destroy it.
	 * That should be handled by the owner that created it.
	 */
	function cleanup(): void {
		mapInteractionStore?.cleanup();
		mapInteractionStore = null;

		if (spinnerInstance) {
			unmount(spinnerInstance);
			spinnerInstance = null;
		}

		if (searchWidget) {
			searchWidget.destroy();
			searchWidget = null;
		}

		if (searchRowEl) {
			mapView.ui.remove(searchRowEl);
			searchRowEl = null;
			spinnerSlotEl = null;
		}

		if (legendExpand) {
			mapView.ui.remove(legendExpand);
			legendExpand.destroy();
			legendExpand = null;
		}

		if (legendWidget) {
			legendWidget.destroy();
			legendWidget = null;
		}

		cleanupMapLoadingWatcher();

		if (mapView.container === mapContainer) {
			mapView.container = null;
		}
	}

	/**
	 * Initialises or refreshes stateful services whenever the map-related dependencies change.
	 */
	$effect(() => {
		if (!mapView) {
			return;
		}

		initialiseMapInteractionStore();

		return () => {
			mapInteractionStore?.cleanup();
			mapInteractionStore = null;
		};
	});

	/**
	 * Updates the displayed map whenever the provided WebMap changes.
	 */
	$effect(() => {
		if (!webMap || !mapContainer) {
			return;
		}

		updateMapWithWebMap();
	});

	/**
	 * Reapplies interaction mode when the tab or layer interaction set changes.
	 */
	$effect(() => {
		if (!mapView?.map || !mapInteractionStore) return;

		const tab = currentTab;
		const layers = interactableLayers;

		applyTabInteractionMode(tab, layers);
	});

	onDestroy(() => {
		cleanup();
	});
</script>

<div class="map-shell">
	<div class="map-view" bind:this={mapContainer}></div>
</div>

<style>
	.map-shell {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
	}

	.map-view {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	/* ArcGIS focus outline - older selector */
	:global(.esri-view .esri-view-surface--inset-outline:focus::after) {
		outline: none !important;
	}

	/* ArcGIS focus outline - newer selector used after DOM changes */
	:global(.esri-view .esri-view-surface--touch-none:focus::after) {
		outline: none !important;
	}
</style>
