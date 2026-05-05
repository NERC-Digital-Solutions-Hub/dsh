<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { SvelteSet } from 'svelte/reactivity';

	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
	import { TabType } from '$lib/Types/Uprn.types';
	import { cn } from '$lib/utils';

	import { ArcgisMapWidgets } from './ArcgisMapWidgets';
	import { applyTabInteractionMode } from './mapInteractionMode';
	import { configureMapView, loadFallbackMap } from './mapViewSetup';

	import type MapView from '@arcgis/core/views/MapView';

	/**
	 * Props accepted by the map view component.
	 *
	 * The parent owns the component's outer layout and size through `class`.
	 * This component owns ArcGIS MapView lifecycle, widget setup, and interaction state.
	 */
	type Props = {
		class?: string;

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

	const {
		class: className,
		webMap,
		mapView,
		areaSelectionInteractionStore,
		interactableLayers,
		currentTab
	}: Props = $props();

	let mapContainer: HTMLDivElement | null = null;
	let mapInteractionStore: MapInteractionStore | null = null;
	let mapWidgets: ArcgisMapWidgets | null = null;
	let mapWidgetsView: MapView | null = null;

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
	 * Attaches a WebMap to the current MapView and configures map UI/state.
	 */
	async function updateMapWithWebMap(
		activeWebMap: __esri.WebMap,
		container: HTMLDivElement
	): Promise<void> {
		try {
			mapView.map = activeWebMap;
			configureMapView(mapView, container);

			const widgets = getMapWidgets();
			await widgets.setupMapLoadingWatcher();
			await widgets.ensureSearchComponent();
			await widgets.ensureLegendComponent();
			await areaSelectionInteractionStore.refreshLayerView();
			await areaSelectionInteractionStore.refreshAreas();

			console.log('[uprn-map-view] MapView updated with new webMap');
		} catch (error) {
			console.error('Error updating MapView with new webMap:', error);
			await loadFallbackMap(mapView, container);
		}
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
	 * Creates or reuses the ArcGIS widget manager for the current MapView instance.
	 */
	function getMapWidgets(): ArcgisMapWidgets {
		if (mapWidgets && mapWidgetsView === mapView) {
			return mapWidgets;
		}

		mapWidgets?.cleanup();
		mapWidgets = new ArcgisMapWidgets(mapView);
		mapWidgetsView = mapView;

		return mapWidgets;
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

		mapWidgets?.cleanup();
		mapWidgets = null;
		mapWidgetsView = null;

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

		void updateMapWithWebMap(webMap, mapContainer);
	});

	/**
	 * Reapplies interaction mode when the tab or layer interaction set changes.
	 */
	$effect(() => {
		if (!mapView?.map || !mapInteractionStore) {
			return;
		}

		void applyTabInteractionMode({
			areaSelectionInteractionStore,
			interactableLayers,
			mapInteractionStore,
			mapView,
			tab: currentTab
		});
	});

	onDestroy(() => {
		cleanup();
	});
</script>

<div class={cn('relative', className)}>
	<div class="h-full w-full" bind:this={mapContainer}></div>
</div>

<style>
	:global(.uprn-map-search-row) {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
	}

	:global(.uprn-map-spinner-slot) {
		display: none;
		align-items: center;
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
