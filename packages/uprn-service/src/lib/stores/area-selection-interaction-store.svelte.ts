import { AreaHighlightController } from '$lib/services/area-selection/area-highlight-controller.svelte';
import { AreaQueryService } from '$lib/services/area-selection/area-query-service';
import type { IWebMapService } from '$lib/services/i-web-map-service';
import type { LayerViewProvider } from '$lib/services/layer-view-provider';
import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
import type {
	AreaFieldHandleInfo,
	AreaSelectionFieldInfo,
	SelectionViewState
} from '$lib/types/selection.types';

export type { AreaFieldHandleInfo, AreaSelectionFieldInfo, SelectionViewState };

/**
 * Compatibility façade used by map and UI features. Reactive highlight state and ArcGIS handles
 * live in AreaHighlightController; layer queries and field resolution live in AreaQueryService.
 */
export class AreaSelectionInteractionStore {
	private readonly areaSelectionStore: AreaSelectionStore;
	private readonly highlights: AreaHighlightController;
	private readonly queries: AreaQueryService;

	constructor(
		areaSelectionStore: AreaSelectionStore,
		layerViewProvider: LayerViewProvider,
		fieldInfos: AreaSelectionFieldInfo[],
		webMapService: IWebMapService | null = null
	) {
		this.areaSelectionStore = areaSelectionStore;
		this.highlights = new AreaHighlightController(areaSelectionStore, layerViewProvider);
		this.queries = new AreaQueryService(layerViewProvider, fieldInfos, webMapService);
	}

	public get selectionViewState(): SelectionViewState {
		return this.highlights.selectionViewState;
	}

	public get lastAddedArea(): AreaFieldHandleInfo | null {
		return this.highlights.lastAddedArea;
	}

	public get lastRemovedArea(): AreaFieldHandleInfo | null {
		return this.highlights.lastRemovedArea;
	}

	public get currentHoveredArea(): AreaFieldHandleInfo | null {
		return this.highlights.currentHoveredArea;
	}

	public get selectedAreaCount(): number {
		return this.areaSelectionStore.areaIds.size;
	}

	public refreshLayerView(): Promise<void> {
		return this.highlights.refreshLayerView();
	}

	public refreshAreas(): Promise<void> {
		return this.highlights.refreshAreas();
	}

	public setFieldInfos(fieldInfos: AreaSelectionFieldInfo[]): void {
		this.queries.setFieldInfos(fieldInfos);
	}

	public setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		this.highlights.setSelectedLayerView(layerView);
	}

	public clearSelectedLayerView(): void {
		this.highlights.clearSelectedLayerView();
	}

	public resetSelectedLayerView(): void {
		this.highlights.resetSelectedLayerView();
	}

	public resetSelectedAreas(): void {
		this.highlights.resetSelectedAreas();
	}

	public addSelectedArea(id: number, handle: __esri.Handle): void {
		this.highlights.addSelectedArea(id, handle);
	}

	public removeSelectedArea(id: number): void {
		this.highlights.removeSelectedArea(id);
	}

	public getAreaNamesById(ids: number[]): Promise<string[]> {
		const layerId = this.selectionViewState.layerView?.layer?.id;
		return layerId ? this.queries.getNames(layerId, ids) : Promise.resolve(ids.map(() => ''));
	}

	public getAreaNamesByLayerId(layerId: string, ids: number[]): Promise<string[]> {
		return this.queries.getNames(layerId, ids);
	}

	public getAreaCodesById(ids: number[]): Promise<string[]> {
		const layerId = this.selectionViewState.layerView?.layer?.id;
		return layerId ? this.queries.getCodes(layerId, ids) : Promise.resolve(ids.map(() => ''));
	}

	public getAreaCodesByLayerId(layerId: string, ids: number[]): Promise<string[]> {
		return this.queries.getCodes(layerId, ids);
	}

	public setHoveredArea(id: number, handle: __esri.Handle): void {
		this.highlights.setHoveredArea(id, handle);
	}

	public clearHoveredArea(): void {
		this.highlights.clearHoveredArea();
	}

	public getNameFieldForCurrentLayer(): string | null {
		const layerId = this.selectionViewState.layerView?.layer?.id;
		return layerId ? this.queries.getNameField(layerId) : null;
	}

	public getNameFieldForLayer(layerId: string): string | null {
		return this.queries.getNameField(layerId);
	}

	public getCodeFieldForCurrentLayer(): string | null {
		const layerId = this.selectionViewState.layerView?.layer?.id;
		return layerId ? this.queries.getCodeField(layerId) : null;
	}

	public getCodeFieldForLayer(layerId: string): string | null {
		return this.queries.getCodeField(layerId);
	}

	public clearSelections(): void {
		this.highlights.clearSelections();
	}

	public cleanup(): void {
		this.highlights.cleanup();
		this.queries.clear();
	}

	public canQueryAreaLayer(layerId: string): boolean {
		return this.queries.canQuery(layerId);
	}
}
