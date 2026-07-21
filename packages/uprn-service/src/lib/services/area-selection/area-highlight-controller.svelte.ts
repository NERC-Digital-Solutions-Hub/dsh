import type { LayerViewProvider } from '$lib/services/layer-view-provider';
import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
import type { AreaFieldHandleInfo, SelectionViewState } from '$lib/types/selection.types';
import { SvelteMap } from 'svelte/reactivity';

/** Owns ArcGIS layer-view selection and hover highlight handles. */
export class AreaHighlightController {
	public selectionViewState = $state<SelectionViewState>({
		layerView: null,
		areaHandles: new SvelteMap<number, __esri.Handle>()
	});
	public lastAddedArea = $state<AreaFieldHandleInfo | null>(null);
	public lastRemovedArea = $state<AreaFieldHandleInfo | null>(null);
	public currentHoveredArea = $state<AreaFieldHandleInfo | null>(null);

	private readonly areaSelectionStore: AreaSelectionStore;
	private readonly layerViewProvider: LayerViewProvider;

	constructor(areaSelectionStore: AreaSelectionStore, layerViewProvider: LayerViewProvider) {
		this.areaSelectionStore = areaSelectionStore;
		this.layerViewProvider = layerViewProvider;
	}

	public async refreshLayerView(): Promise<void> {
		if (!this.areaSelectionStore.layerId && this.selectionViewState.layerView !== null) {
			this.resetSelectedLayerView();
			return;
		}
		if (this.selectionViewState.layerView?.layer?.id === this.areaSelectionStore.layerId) return;
		if (!this.areaSelectionStore.layerId) {
			this.resetSelectedAreas();
			return;
		}

		const layerView = await this.layerViewProvider.getLayerViewById(
			this.areaSelectionStore.layerId
		);
		if (!layerView) {
			console.warn(
				`[area-highlight-controller] no layer view found for layer ID ${this.areaSelectionStore.layerId}.`
			);
			return;
		}
		this.setSelectedLayerView(layerView as __esri.FeatureLayerView);
	}

	public async refreshAreas(): Promise<void> {
		const layerView = this.selectionViewState.layerView;
		if (!layerView) {
			this.resetSelectedAreas();
			return;
		}
		const selected = this.areaSelectionStore.areaIds;
		const handles = this.selectionViewState.areaHandles;
		for (const id of handles.keys()) {
			if (!selected.has(id)) this.removeSelectedArea(id);
		}
		for (const id of selected) {
			if (!handles.has(id)) {
				const handle = layerView.highlight(id, { name: 'selected' });
				if (handle) this.addSelectedArea(id, handle);
			}
		}
	}

	public setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		if (this.selectionViewState.layerView === layerView) return;
		this.resetSelectedAreas();
		this.selectionViewState = {
			layerView,
			areaHandles: new SvelteMap<number, __esri.Handle>()
		};
	}

	public clearSelectedLayerView(): void {
		if (this.selectionViewState.layerView === null) return;
		this.resetSelectedAreas();
		this.selectionViewState.layerView = null;
	}

	public resetSelectedLayerView(): void {
		this.resetSelectedAreas();
		this.selectionViewState = {
			layerView: null,
			areaHandles: new SvelteMap<number, __esri.Handle>()
		};
	}

	public resetSelectedAreas(): void {
		for (const handle of this.selectionViewState.areaHandles.values()) handle.remove();
		this.selectionViewState.areaHandles.clear();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
	}

	public addSelectedArea(id: number, handle: __esri.Handle): void {
		this.lastAddedArea = { id, handle };
		this.selectionViewState.areaHandles.set(id, handle);
		this.areaSelectionStore.addAreaSelection(id);
	}

	public removeSelectedArea(id: number): void {
		const removedHandle = this.selectionViewState.areaHandles.get(id);
		if (!removedHandle) {
			this.areaSelectionStore.removeSelectedArea(id);
			return;
		}
		this.lastRemovedArea = { id, handle: removedHandle };
		removedHandle.remove();
		this.selectionViewState.areaHandles.delete(id);
		this.areaSelectionStore.removeSelectedArea(id);
	}

	public setHoveredArea(id: number, handle: __esri.Handle): void {
		if (id === this.currentHoveredArea?.id) return;
		this.clearHoveredArea();
		this.currentHoveredArea = { id, handle };
	}

	public clearHoveredArea(): void {
		this.currentHoveredArea?.handle.remove();
		this.currentHoveredArea = null;
	}

	public clearSelections(): void {
		this.resetSelectedAreas();
		this.areaSelectionStore.clearSelectedAreas();
	}

	public cleanup(): void {
		this.resetSelectedAreas();
	}
}
