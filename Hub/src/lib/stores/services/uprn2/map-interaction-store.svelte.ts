import type MapView from '@arcgis/core/views/MapView';
import {
	areaSelectionStore,
	type HighlightAreaInfo
} from '$lib/stores/services/uprn2/area-selection-store.svelte';

/**
 * Store for managing MapView interactions including pointer-move and click events.
 * Handles hover highlighting and area selection logic.
 */
class MapInteractionStore {
	private mapView: MapView | null = $state<MapView | null>(null);
	private interactableLayers: Set<string> = $state(new Set<string>());
	private pointerMoveHandle: __esri.Handle | null = null;
	private clickHandle: __esri.Handle | null = null;
	private leaveHandle: __esri.Handle | null = null;
	private enterHandle: __esri.Handle | null = null;
	private isInitialized = $state<boolean>(false);
	private pointerInsideMap = $state<boolean>(true);

	private initializationInProgress = false;

	/**
	 * Initialize the store with a MapView and set up event handlers
	 * @param view - The Esri MapView to attach interactions to
	 * @param interactableLayers - Set of layer names that can be interacted with
	 */
	public async initializeAsync(view: MapView, interactableLayers: Set<string>): Promise<void> {
		console.log('[map-interaction-store] Initializing with MapView');
		if (this.mapView === view && this.isInitialized) {
			console.log('[map-interaction-store] MapView is already initialized');
			this.interactableLayers = interactableLayers;
			return;
		}

		if (this.initializationInProgress) {
			console.log('[map-interaction-store] Initialization already in progress');
			return;
		}

		this.initializationInProgress = true;

		console.log('[map-interaction-store] Cleaning up previous MapView if any');
		this.cleanup();

		this.mapView = view;
		this.interactableLayers = interactableLayers;

		await view.when();

		this.setupHighlights(view);

		this.setupPointerMoveHandler(view);
		this.setupClickHandler(view);
		this.setupLeaveHandler(view);
		this.setupEnterHandler(view);

		this.isInitialized = true;
		console.log('[map-interaction-store] Initialized with MapView');

		this.initializationInProgress = false;
	}

	public updateInteractableLayers(interactableLayers: Set<string>): void {
		this.interactableLayers = interactableLayers;
	}

	/**
	 * Set up the highlight styles for hover and selected states
	 * @param view - The MapView to add highlights to
	 */
	private setupHighlights(view: MapView): void {
		const hoverHighlight = {
			name: 'hover',
			color: 'lightgreen',
			haloOpacity: 1,
			fillOpacity: 0.2
		} as unknown as __esri.HighlightOptions;

		const selectedHighlight = {
			name: 'selected',
			color: 'green',
			haloOpacity: 1,
			fillOpacity: 0.3
		} as unknown as __esri.HighlightOptions;

		view.highlights.push(hoverHighlight);
		view.highlights.push(selectedHighlight);
	}

	/**
	 * Set up the pointer-move event handler for hover highlighting
	 * @param view - The MapView to attach the handler to
	 */
	private setupPointerMoveHandler(view: MapView): void {
		this.pointerMoveHandle = view.on('pointer-move', async (event) => {
			if (!this.pointerInsideMap) {
				return;
			}

			const { results } = await view.hitTest(event);
			const result = results[0];

			if (!result) {
				this.clearHoverHighlight();
				return;
			}

			const graphic = (result as __esri.GraphicHit).graphic;
			const layer = graphic.layer as __esri.FeatureLayer;

			if (
				!graphic ||
				!layer ||
				!this.isLayerInteractable(layer.id as string) ||
				graphic.attributes?.[layer.objectIdField] === undefined
			) {
				this.clearHoverHighlight();
				return;
			}

			const objectIdField = graphic.attributes?.[layer.objectIdField];

			if (
				areaSelectionStore.currentHoveredArea &&
				areaSelectionStore.currentHoveredArea.id === objectIdField
			) {
				return;
			}

			try {
				const layerView = await view.whenLayerView(layer);

				if (areaSelectionStore.layerHighlightState.featureLayerView !== layerView) {
					areaSelectionStore.setSelectedLayerView(layerView);
				}

				this.clearHoverHighlight();

				const featureLayerView = layerView as __esri.FeatureLayerView;
				if (!featureLayerView) {
					console.warn('LayerView is not a FeatureLayerView');
					return;
				}

				if (!this.pointerInsideMap) {
					return;
				}

				const hoverHandle = featureLayerView.highlight(graphic, { name: 'hover' });
				areaSelectionStore.setHoveredArea(objectIdField, hoverHandle);
			} catch (error) {
				console.error('Error in pointer-move handler:', error);
				this.clearHoverHighlight();
			}
		});
	}

	/**
	 * Set up the click event handler for area selection
	 * @param view - The MapView to attach the handler to
	 */
	private setupClickHandler(view: MapView): void {
		this.clickHandle = view.on('click', async (event) => {
			const { results } = await view.hitTest(event);
			const result = results[0];

			if (!result) {
				return;
			}

			const graphic = (result as __esri.GraphicHit).graphic;
			const layer = graphic.layer as __esri.FeatureLayer;

			if (
				!graphic ||
				!layer ||
				!this.isLayerInteractable(layer.id as string) ||
				graphic.attributes?.[layer.objectIdField] === undefined
			) {
				return;
			}

			const objectId = graphic.attributes?.[layer.objectIdField];

			try {
				const layerView = await view.whenLayerView(layer);
				const featureLayerView = layerView as __esri.FeatureLayerView;

				if (!featureLayerView) {
					console.warn('Layer is not a FeatureLayerView');
					return;
				}

				// Update the selected layer view if needed
				if (areaSelectionStore.layerHighlightState.featureLayerView !== layerView) {
					areaSelectionStore.setSelectedLayerView(layerView);
				}

				// Check if this area is already selected
				const handleInfos: HighlightAreaInfo[] =
					areaSelectionStore.layerHighlightState.areaInfos || [];
				const existingHandle: HighlightAreaInfo | undefined = handleInfos.find(
					(info) => info.id === objectId
				);

				if (existingHandle) {
					areaSelectionStore.removeSelectedArea(existingHandle.id);
				} else {
					const handle = featureLayerView.highlight(graphic, { name: 'selected' });
					areaSelectionStore.addSelectedArea(objectId, handle);
				}
			} catch (error) {
				console.error('Error in click handler:', error);
			}
		});
	}

	/**
	 * Set up the pointer-leave event handler for area selection
	 * @param view - The MapView to attach the handler to
	 */
	private setupLeaveHandler(view: MapView): void {
		this.leaveHandle = view.on('pointer-leave', () => {
			this.pointerInsideMap = false;
			this.clearHoverHighlight();
		});
	}

	/**
	 * Set up the pointer-enter event handler
	 * @param view - The MapView to attach the handler to
	 */
	private setupEnterHandler(view: MapView): void {
		this.enterHandle = view.on('pointer-enter', () => {
			this.pointerInsideMap = true;
		});
	}

	/**
	 * Check if a layer is interactable based on its name
	 * @param layerName - The name of the layer to check
	 * @returns True if the layer is interactable, false otherwise
	 */
	private isLayerInteractable(layerName: string): boolean {
		return this.interactableLayers.has(layerName);
	}

	/**
	 * Clear the current hover highlight
	 */
	private clearHoverHighlight(): void {
		if (areaSelectionStore.currentHoveredArea) {
			areaSelectionStore.clearHoveredArea();
		}
	}

	/**
	 * Clean up event handlers and resources
	 */
	public cleanup(): void {
		if (this.pointerMoveHandle) {
			this.pointerMoveHandle.remove();
			this.pointerMoveHandle = null;
		}

		if (this.clickHandle) {
			this.clickHandle.remove();
			this.clickHandle = null;
		}

		if (this.leaveHandle) {
			this.leaveHandle.remove();
			this.leaveHandle = null;
		}

		if (this.enterHandle) {
			this.enterHandle.remove();
			this.enterHandle = null;
		}

		this.clearHoverHighlight();
		this.isInitialized = false;
		this.mapView = null;
		this.pointerInsideMap = true;
		this.interactableLayers = new Set();

		console.log('[map-interaction-store] cleaned up');
	}

	/**
	 * Get the current MapView instance
	 */
	public get currentMapView(): MapView | null {
		return this.mapView;
	}

	/**
	 * Check if the store is initialized with a MapView
	 */
	public get initialized(): boolean {
		return this.isInitialized;
	}
}

export const mapInteractionStore = new MapInteractionStore();
