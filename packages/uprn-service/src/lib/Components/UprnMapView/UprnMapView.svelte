<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { SvelteSet } from 'svelte/reactivity';

	import * as ContextMenu from '$lib/Components/shadcn/context-menu';
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { MapInteractionStore } from '$lib/Stores/MapInteractionStore.svelte';
	import { TabType } from '$lib/Types/Uprn.types';
	import { cn } from '$lib/utils';
	import { Eraser, EyeOff, List, ZoomIn, ZoomOut } from '@lucide/svelte';

	import { ArcgisMapWidgets } from './ArcgisMapWidgets';
	import { applyTabInteractionMode } from './mapInteractionMode';
	import { configureMapView, loadFallbackMap } from './mapViewSetup';
	import { attachNativeContextMenuBridge } from './nativeContextMenuBridge';
	import UprnMapContextMenu, { type UprnMapContextMenuEntries } from './UprnMapContextMenu.svelte';

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

		/**
		 * Clears area selections and hides hideable data layers.
		 */
		onClearSelections?: () => void;

		/**
		 * Hides visible data layers.
		 */
		onHideVisibleDataLayer?: () => void;

		/**
		 * True when at least one data layer is currently visible on the map.
		 */
		hasVisibleDataLayer?: boolean;
	};

	const {
		class: className,
		webMap,
		mapView,
		areaSelectionInteractionStore,
		interactableLayers,
		currentTab,
		onClearSelections,
		onHideVisibleDataLayer,
		hasVisibleDataLayer = false
	}: Props = $props();

	let mapContainer: HTMLDivElement | null = null;
	let contextMenuShell = $state<HTMLDivElement | null>(null);
	let contextMenuTrigger = $state<HTMLDivElement | null>(null);
	let mapInteractionStore: MapInteractionStore | null = null;
	let mapWidgets: ArcgisMapWidgets | null = null;
	let mapWidgetsView: MapView | null = null;
	let contextMenuOpen = $state(false);
	let legendIsOpen = $state(false);
	let mapContextMenuEntries: UprnMapContextMenuEntries = $derived.by(() => ({
		zoomIn: {
			action: zoomIn,
			icon: ZoomIn,
			kind: 'action',
			label: 'Zoom In'
		},
		zoomOut: {
			action: zoomOut,
			icon: ZoomOut,
			kind: 'action',
			label: 'Zoom Out'
		},
		toggleLegend: {
			action: toggleLegend,
			icon: List,
			kind: 'action',
			label: legendIsOpen ? 'Close Legend' : 'Open Legend'
		},
		selectionSeparator: {
			kind: 'separator'
		},
		hideDataLayer: {
			action: () => onHideVisibleDataLayer?.(),
			disabled: !hasVisibleDataLayer,
			icon: EyeOff,
			kind: 'action',
			label: 'Hide Data Layer'
		},
		clear: {
			action: () => onClearSelections?.(),
			disabled: areaSelectionInteractionStore.selectedAreaCount === 0,
			icon: Eraser,
			kind: 'action',
			label: 'Clear Area(s)'
		}
	}));

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
	 * Zooms the map in by one ArcGIS zoom level.
	 */
	function zoomIn(): void {
		void mapView.goTo({ zoom: mapView.zoom + 1 });
	}

	/**
	 * Zooms the map out by one ArcGIS zoom level.
	 */
	function zoomOut(): void {
		void mapView.goTo({ zoom: mapView.zoom - 1 });
	}

	/**
	 * Opens or closes the ArcGIS legend expand widget.
	 */
	function toggleLegend(): void {
		mapWidgets?.toggleLegend();
		syncLegendState();
	}

	/**
	 * Synchronises local menu label state with the ArcGIS expand widget state.
	 */
	function syncLegendState(): void {
		legendIsOpen = mapWidgets?.isLegendExpanded() ?? false;
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

	/**
	 * Refreshes the legend menu label from the ArcGIS widget whenever the menu is opened.
	 */
	$effect(() => {
		if (!contextMenuOpen) {
			return;
		}

		syncLegendState();
	});

	/**
	 * ArcGIS handles map pointer events internally, so capture native context menu events
	 * and forward allowed map-surface right-clicks to the shadcn trigger.
	 */
	$effect(() => {
		const shell = contextMenuShell;
		if (!shell) return;
		return attachNativeContextMenuBridge(shell, () => contextMenuTrigger);
	});

	onDestroy(() => {
		cleanup();
	});
</script>

<div class={cn('relative', className)} bind:this={contextMenuShell}>
	<ContextMenu.ContextMenu bind:open={contextMenuOpen}>
		<ContextMenu.ContextMenuTrigger bind:ref={contextMenuTrigger} class="block h-full w-full">
			<div class="h-full w-full" bind:this={mapContainer}></div>
		</ContextMenu.ContextMenuTrigger>

		<UprnMapContextMenu entries={mapContextMenuEntries} />
	</ContextMenu.ContextMenu>
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
