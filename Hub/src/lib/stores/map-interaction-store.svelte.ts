import type MapView from '@arcgis/core/views/MapView';
import {
	selectedAreasStore,
	type HighlightAreaInfo
} from '$lib/stores/selected-areas-store.svelte';

/**
 * Store for managing MapView interactions including pointer-move and click events.
 * Handles hover highlighting and area selection logic.
 */
class MapInteractionStore {
	private mapView: MapView | null = $state<MapView | null>(null);
	private pointerMoveHandle: __esri.Handle | null = null;
	private clickHandle: __esri.Handle | null = null;
	private isInitialized = $state<boolean>(false);

	/**
	 * Initialize the store with a MapView and set up event handlers
	 * @param view - The Esri MapView to attach interactions to
	 */
	public async initializeWithMapView(view: MapView): Promise<void> {
		// Clean up existing handlers if any
		this.cleanup();

		this.mapView = view;

		// Wait for the view to be ready
		await view.when();

		// Set up highlights
		this.setupHighlights(view);

		// Set up event handlers
		this.setupPointerMoveHandler(view);
		this.setupClickHandler(view);

		this.isInitialized = true;
		console.log('MapInteractionStore initialized with MapView');
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
			const { results } = await view.hitTest(event);
			const result = results[0];

			if (!result) {
				this.clearHoverHighlight();
				return;
			}

			const graphic = (result as __esri.GraphicHit).graphic;
			const layer = graphic.layer as __esri.FeatureLayer;

			if (!graphic || !layer || graphic.attributes?.[layer.objectIdField] === undefined) {
				this.clearHoverHighlight();
				return;
			}

			const objectIdField = graphic.attributes?.[layer.objectIdField];

			// Check if we're already highlighting this area
			if (
				selectedAreasStore.currentHoveredArea &&
				selectedAreasStore.currentHoveredArea.id === objectIdField
			) {
				return; // Already highlighted
			}

			try {
				const layerView = await view.whenLayerView(layer);

				// Update the selected layer view if needed
				if (selectedAreasStore.layerHighlightState.featureLayerView !== layerView) {
					selectedAreasStore.setSelectedLayerView(layerView);
				}

				// Clear previous hover highlight
				this.clearHoverHighlight();

				const featureLayerView = layerView as __esri.FeatureLayerView;
				if (!featureLayerView) {
					console.warn('LayerView is not a FeatureLayerView');
					return;
				}

				// Create new hover highlight
				selectedAreasStore.currentHoveredArea = {
					id: objectIdField,
					handle: featureLayerView.highlight(graphic, { name: 'hover' })
				};
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

			if (!graphic || !layer || graphic.attributes?.[layer.objectIdField] === undefined) {
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
				if (selectedAreasStore.layerHighlightState.featureLayerView !== layerView) {
					selectedAreasStore.setSelectedLayerView(layerView);
				}

				// Check if this area is already selected
				const handleInfos: HighlightAreaInfo[] =
					selectedAreasStore.layerHighlightState.areaInfos || [];
				const existingHandle: HighlightAreaInfo | undefined = handleInfos.find(
					(info) => info.id === objectId
				);

				if (existingHandle) {
					// Area is already selected, remove it
					selectedAreasStore.removeSelectedArea(existingHandle.id);
				} else {
					// Area is not selected, add it
					const handle = featureLayerView.highlight(graphic, { name: 'selected' });
					selectedAreasStore.addSelectedArea(objectId, handle);
				}
			} catch (error) {
				console.error('Error in click handler:', error);
			}
		});
	}

	/**
	 * Clear the current hover highlight
	 */
	private clearHoverHighlight(): void {
		if (selectedAreasStore.currentHoveredArea) {
			selectedAreasStore.currentHoveredArea.handle.remove();
			selectedAreasStore.currentHoveredArea = null;
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

		this.clearHoverHighlight();
		this.isInitialized = false;
		this.mapView = null;

		console.log('MapInteractionStore cleaned up');
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
