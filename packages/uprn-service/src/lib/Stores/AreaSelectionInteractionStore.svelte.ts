import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import type { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
import { SvelteMap } from 'svelte/reactivity';

export type AreaSelectionFieldInfo = {
	id: string;
	nameField: string;
	codeField: string;
};

export type SelectionViewState = {
	layerView: __esri.FeatureLayerView | null;
	areaHandles: Map<number, __esri.Handle>;
};

export type AreaFieldHandleInfo = {
	id: number;
	handle: __esri.Handle;
};

/**
 * Store for managing interactions with area selection on the map.
 */
export class AreaSelectionInteractionStore {
	/**
	 * The area selection store.
	 */
	private areaSelectionStore: AreaSelectionStore;

	/**
	 * Provider for getting LayerViews.
	 */
	private layerViewProvider: LayerViewProvider;

	/**
	 * The current layer view for the area selection layer.
	 */
	public selectionViewState = $state<SelectionViewState>({
		layerView: null,
		areaHandles: new SvelteMap<number, __esri.Handle>()
	});

	/**
	 * The last added area handle info.
	 */
	public lastAddedArea = $state<AreaFieldHandleInfo | null>(null);

	/**
	 * The last removed area handle info.
	 */
	public lastRemovedArea = $state<AreaFieldHandleInfo | null>(null);

	/**
	 * The currently hovered area handle info.
	 */
	public currentHoveredArea = $state<AreaFieldHandleInfo | null>(null);

	/**
	 * Field infos for area selection layers. This is used to find where the name and code is found in the layer fields.
	 */
	private fieldInfoByLayerId = new SvelteMap<string, AreaSelectionFieldInfo>();

	/**
	 * Cache where the layer ID is the first key, then the area IDs map to names.
	 */
	private cachedNames = new SvelteMap<string, Map<number, string>>();

	constructor(
		areaSelectionStore: AreaSelectionStore,
		layerViewProvider: LayerViewProvider,
		fieldInfos: AreaSelectionFieldInfo[]
	) {
		this.areaSelectionStore = areaSelectionStore;
		this.layerViewProvider = layerViewProvider;
		this.setFieldInfoMap(fieldInfos);
	}

	public async refreshLayerView(): Promise<void> {
		console.log(
			'[area-selection-interaction-store] refreshing layer view for area selection store.'
		);
		if (!this.areaSelectionStore.layerId && this.selectionViewState.layerView !== null) {
			this.resetSelectedLayerView();
			return;
		}

		if (this.selectionViewState.layerView?.layer?.id === this.areaSelectionStore.layerId) {
			return;
		}

		if (!this.areaSelectionStore.layerId) {
			this.resetSelectedAreas();
			return;
		}

		const layerView = await this.layerViewProvider.getLayerViewById(
			this.areaSelectionStore.layerId
		);
		if (!layerView) {
			console.warn(
				`[area-selection-interaction-store] no layer view found for layer ID ${this.areaSelectionStore.layerId}.`
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
			if (!selected.has(id)) {
				this.removeSelectedArea(id);
			}
		}

		for (const id of selected) {
			if (handles.has(id)) {
				continue;
			}

			const handle = layerView.highlight(id, { name: 'selected' });
			if (handle) {
				this.addSelectedArea(id, handle);
			}
		}
	}

	public setFieldInfos(fieldInfos: AreaSelectionFieldInfo[]): void {
		this.setFieldInfoMap(fieldInfos);
	}

	public setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		if (this.selectionViewState?.layerView === layerView) {
			return;
		}

		this.resetSelectedAreas();

		this.selectionViewState = {
			layerView: layerView,
			areaHandles: new SvelteMap<number, __esri.Handle>()
		};
	}

	public clearSelectedLayerView(): void {
		if (this.selectionViewState.layerView === null) {
			return;
		}

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
		if (this.selectionViewState.areaHandles.size === 0) {
			return;
		}

		this.selectionViewState.areaHandles.values().forEach((handle) => {
			handle.remove();
		});

		this.selectionViewState.areaHandles.clear();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
	}

	public addSelectedArea(id: number, handle: __esri.Handle): void {
		if (!this.selectionViewState) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const areaInfo: AreaFieldHandleInfo = { id, handle };
		this.lastAddedArea = areaInfo;

		this.selectionViewState.areaHandles.set(id, handle);
		this.areaSelectionStore.addAreaSelection(id);
	}

	public removeSelectedArea(id: number): void {
		if (!this.selectionViewState) {
			console.warn(`[area-selection-interaction-store] no feature layer view is set.`);
			return;
		}

		const removedHandle = this.selectionViewState.areaHandles.get(id);
		if (!removedHandle) {
			this.areaSelectionStore.removeSelectedArea(id);
			return;
		}

		console.log(`[area-selection-interaction-store] removing selected area ID ${id}.`);
		this.lastRemovedArea = { id, handle: removedHandle };

		removedHandle.remove();
		this.selectionViewState.areaHandles.delete(id);
		this.areaSelectionStore.removeSelectedArea(id);
	}

	public async getAreaNamesById(ids: number[]): Promise<string[]> {
		const layerId = this.selectionViewState?.layerView?.layer?.id;
		if (!layerId) return ids.map(() => '');

		return await this.getAreaNamesByLayerId(layerId, ids);
	}

	public async getAreaNamesByLayerId(layerId: string, ids: number[]): Promise<string[]> {
		if (ids.length === 0) return [];

		const nameField = this.getNameFieldForLayer(layerId);
		if (!nameField) return ids.map(() => '');

		const layer = this.getFeatureLayerById(layerId);
		if (!layer) return ids.map(() => '');

		let cache = this.cachedNames.get(layer.uid);
		if (!cache) {
			cache = new SvelteMap<number, string>();
			this.cachedNames.set(layer.uid, cache);
		}

		const names: (string | undefined)[] = new Array(ids.length);
		const idToIndex = new SvelteMap<number, number>();
		const missingIds: number[] = [];

		ids.forEach((id, idx) => {
			idToIndex.set(id, idx);
			const cached = cache.get(id);
			if (cached !== undefined) {
				names[idx] = cached;
			} else {
				missingIds.push(id);
			}
		});

		if (missingIds.length === 0) {
			return names.map((n) => n ?? '');
		}

		const objectIdField: string = layer.objectIdField;
		try {
			const result = await layer.queryFeatures({
				objectIds: missingIds,
				outFields: [nameField, objectIdField],
				returnGeometry: false
			});

			for (const feature of result.features) {
				const id = feature.attributes[objectIdField] as number;
				const name = feature.attributes[nameField] as string;
				const idx = idToIndex.get(id);
				if (idx !== undefined) {
					names[idx] = name ?? '';
					cache!.set(id, name ?? '');
				}
			}
		} catch (error) {
			console.warn('[area-selection-interaction-store] failed to query area names.', error);
		}

		return names.map((n) => n ?? '');
	}

	public async getAreaCodesById(ids: number[]): Promise<string[]> {
		const layerId = this.selectionViewState?.layerView?.layer?.id;
		if (!layerId) return ids.map(() => '');

		return await this.getAreaCodesByLayerId(layerId, ids);
	}

	public async getAreaCodesByLayerId(layerId: string, ids: number[]): Promise<string[]> {
		if (ids.length === 0) return [];

		const codeField = this.getCodeFieldForLayer(layerId);
		if (!codeField) return ids.map(() => '');

		const layer = this.getFeatureLayerById(layerId);
		if (!layer) return ids.map(() => '');

		const objectIdField = layer.objectIdField;

		const idToIndex = new SvelteMap<number, number>();
		const codes: string[] = new Array(ids.length).fill('');

		ids.forEach((id, index) => {
			idToIndex.set(id, index);
		});

		try {
			const result = await layer.queryFeatures({
				objectIds: ids,
				outFields: [codeField, objectIdField],
				returnGeometry: false
			});

			for (const feature of result.features) {
				const id = feature.attributes[objectIdField] as number;
				const code = feature.attributes[codeField] as string;
				const index = idToIndex.get(id);

				if (index !== undefined) {
					codes[index] = code ?? '';
				}
			}
		} catch (error) {
			console.warn('[area-selection-interaction-store] failed to query area codes.', error);
		}

		return codes;
	}

	public setHoveredArea(id: number, handle: __esri.Handle): void {
		if (id === this.currentHoveredArea?.id) {
			return;
		}

		if (this.currentHoveredArea) {
			this.clearHoveredArea();
		}

		this.currentHoveredArea = { id, handle };
	}

	public clearHoveredArea(): void {
		if (!this.currentHoveredArea) {
			return;
		}

		this.currentHoveredArea?.handle.remove();
		this.currentHoveredArea = null;
	}

	public getNameFieldForCurrentLayer(): string | null {
		if (
			!this.selectionViewState ||
			!this.selectionViewState.layerView ||
			!this.selectionViewState.layerView.layer
		) {
			return null;
		}

		const layerId = this.selectionViewState.layerView?.layer?.id;
		if (!layerId) return null;

		return this.getNameFieldForLayer(layerId);
	}

	public getNameFieldForLayer(layerId: string): string | null {
		const info = this.fieldInfoByLayerId.get(layerId);
		if (!info) {
			console.warn(
				`[area-selection-interaction-store] no name field configured for layer ${layerId}`
			);
			return null;
		}

		return info.nameField;
	}

	public getCodeFieldForCurrentLayer(): string | null {
		if (
			!this.selectionViewState ||
			!this.selectionViewState.layerView ||
			!this.selectionViewState.layerView.layer
		) {
			return null;
		}

		const layerId = this.selectionViewState.layerView?.layer?.id;
		if (!layerId) return null;

		return this.getCodeFieldForLayer(layerId);
	}

	public getCodeFieldForLayer(layerId: string): string | null {
		const info = this.fieldInfoByLayerId.get(layerId);
		if (!info) {
			console.warn(
				`[area-selection-interaction-store] no code field configured for layer ${layerId}`
			);
			return null;
		}
		return info.codeField;
	}

	public get selectedAreaCount(): number {
		return this.areaSelectionStore.areaIds.size;
	}

	public clearSelections(): void {
		this.resetSelectedAreas();
		this.areaSelectionStore.clearSelectedAreas();
		this.clearHoveredArea();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
		console.log('[area-selection-interaction-store] selections cleared.');
	}

	public cleanup(): void {
		this.resetSelectedAreas();
		this.clearHoveredArea();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
		this.cachedNames.clear();
		this.fieldInfoByLayerId.clear();

		console.log('[area-selection-interaction-store] cleaned up.');
	}

	private setFieldInfoMap(fieldInfos: AreaSelectionFieldInfo[]): void {
		this.fieldInfoByLayerId.clear();
		for (const info of fieldInfos) {
			this.fieldInfoByLayerId.set(info.id, info);
		}
	}

	private getFeatureLayerById(layerId: string): __esri.FeatureLayer | null {
		const layer = this.layerViewProvider.getLayerById(layerId);
		if (!layer || !('queryFeatures' in layer) || !('objectIdField' in layer)) {
			console.warn(
				`[area-selection-interaction-store] no queryable feature layer found for ${layerId}.`
			);
			return null;
		}

		return layer as __esri.FeatureLayer;
	}
}
