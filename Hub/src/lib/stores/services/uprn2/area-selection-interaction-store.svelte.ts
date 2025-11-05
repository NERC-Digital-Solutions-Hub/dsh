import type { LayerViewProvider } from '$lib/services/layer-view-provider';
import type { AreaSelectionStore2 } from '$lib/stores/services/uprn2/area-selection-store2.svelte';
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export type AreaSelectionFieldInfo = {
	layerName: string;
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
	private areaSelectionStore: AreaSelectionStore2;

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
	private fieldInfos: AreaSelectionFieldInfo[] = [];

	/**
	 * Cache where the layer ID is the first key, then the area IDs map to names.
	 */
	private cachedNames = new SvelteMap<string, Map<number, string>>();

	constructor(areaSelectionStore: AreaSelectionStore2, layerViewProvider: LayerViewProvider) {
		this.areaSelectionStore = areaSelectionStore;
		this.layerViewProvider = layerViewProvider;

		$effect.root(() => {
			$effect(() => {
				if (!this.areaSelectionStore.layerId) {
					this.resetSelectedLayerView();
					return;
				}

				if (this.selectionViewState.layerView?.layer?.id === this.areaSelectionStore.layerId) {
					return;
				}

				const layerView = this.layerViewProvider.getLayerViewById(this.areaSelectionStore.layerId);
				if (!layerView) {
					return;
				}

				this.setSelectedLayerView(layerView as unknown as FeatureLayerView);
			});

			$effect(() => {
				this.areaSelectionStore.selectedAreaIds.forEach((id) => {
					if (this.selectionViewState.areaHandles.has(id)) {
						return; // Already handled
					}

					const handle = this.selectionViewState.layerView?.highlight(id);
					if (handle) {
						this.addSelectedArea(id, handle);
					}
				});

				if (
					this.selectionViewState.areaHandles.size === this.areaSelectionStore.selectedAreaIds.size
				) {
					return; // All areas are already handled
				}

				// Remove any areas that are no longer selected
				const currentIds = new SvelteSet(this.selectionViewState.areaHandles.keys());
				this.areaSelectionStore.selectedAreaIds.forEach((id) => {
					if (!currentIds.has(id)) {
						this.removeSelectedArea(id);
					}
				});
			});
		});
	}

	setFieldInfos(fieldInfos: AreaSelectionFieldInfo[]): void {
		console.log('[area-selection-interaction-store] setting field infos:', fieldInfos);
		this.fieldInfos = fieldInfos;
	}

	setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		if (this.selectionViewState?.layerView === layerView) {
			return;
		}

		this.selectionViewState = {
			layerView: layerView,
			areaHandles: new SvelteMap<number, __esri.Handle>()
		};

		this.resetSelectedAreas();
	}

	clearSelectedLayerView(): void {
		if (this.selectionViewState.layerView === null) {
			return;
		}

		this.resetSelectedAreas();
		this.selectionViewState.layerView = null;
	}

	resetSelectedLayerView(): void {
		this.selectionViewState = {
			layerView: null,
			areaHandles: new SvelteMap<number, __esri.Handle>()
		};

		this.resetSelectedAreas();
	}

	resetSelectedAreas(): void {
		if (!this.selectionViewState.layerView && this.selectionViewState.areaHandles.size === 0) {
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

	addSelectedArea(id: number, handle: __esri.Handle): void {
		if (!this.selectionViewState) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const areaInfo: AreaFieldHandleInfo = { id, handle };
		this.lastAddedArea = areaInfo;

		this.selectionViewState.areaHandles.set(id, handle);

		console.log(
			`[area-selection-interaction-store] added selected area: ${id}`,
			this.selectionViewState.areaHandles
		);
	}

	removeSelectedArea(id: number): void {
		if (!this.selectionViewState) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const removedHandle = this.selectionViewState.areaHandles.get(id);
		if (!removedHandle) {
			console.warn(`SelectedAreasStore: No handle found for area ID ${id}.`);
			return;
		}

		this.lastRemovedArea = { id, handle: removedHandle };

		removedHandle.remove();
		this.selectionViewState.areaHandles.delete(id);

		console.log(`[area-selection-interaction-store] removed selected area: ${id}`);
	}

	async getAreaNamesById(ids: number[]): Promise<string[]> {
		if (!this.selectionViewState?.layerView) return [];

		const nameField = this.getNameFieldForCurrentLayer();
		if (!nameField) return [];

		const layer = this.selectionViewState.layerView.layer as __esri.FeatureLayer;

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

		return names.map((n) => n ?? '');
	}

	async getAreaCodesById(ids: number[]): Promise<string[]> {
		if (!this.selectionViewState?.layerView) return [];

		const codeField = this.getCodeFieldForCurrentLayer();
		if (!codeField) return [];

		const layer = this.selectionViewState.layerView.layer as __esri.FeatureLayer;

		const objectIdField: string = layer.objectIdField;
		const result = await layer.queryFeatures({
			objectIds: ids,
			outFields: [codeField, objectIdField],
			returnGeometry: false
		});

		const codes: (string | undefined)[] = new Array(ids.length);
		for (const feature of result.features) {
			const id = feature.attributes[objectIdField] as number;
			const code = feature.attributes[codeField] as string;

			const index = ids.indexOf(id);
			if (index !== -1) {
				codes[index] = code ?? '';
			}
		}

		return codes.map((n) => n ?? '');
	}

	setHoveredArea(id: number, handle: __esri.Handle): void {
		if (id === this.currentHoveredArea?.id) {
			return;
		}

		if (this.currentHoveredArea) {
			this.clearHoveredArea();
		}

		console.log('[area-selection-interaction-store] setting hovered area:', id);
		this.currentHoveredArea = { id, handle };
	}

	clearHoveredArea(): void {
		if (!this.currentHoveredArea) {
			return;
		}

		console.log(
			'[area-selection-interaction-store] clearing hovered area:',
			this.currentHoveredArea.id
		);
		this.currentHoveredArea?.handle.remove();
		this.currentHoveredArea = null;
	}

	getNameFieldForCurrentLayer(): string | null {
		if (
			!this.selectionViewState ||
			!this.selectionViewState.layerView ||
			!this.selectionViewState.layerView.layer
		) {
			return null;
		}

		const nameField: string | undefined = this.fieldInfos.find(
			(l) => l.layerName === this.selectionViewState?.layerView?.layer?.title
		)?.nameField;

		if (!nameField) {
			console.warn(
				`SelectedAreasStore: No name field configured for layer ${this.selectionViewState.layerView.layer.title}`,
				this.fieldInfos
			);
			return null;
		}

		return nameField;
	}

	getCodeFieldForCurrentLayer(): string | null {
		if (
			!this.selectionViewState ||
			!this.selectionViewState.layerView ||
			!this.selectionViewState.layerView.layer
		) {
			return null;
		}
		const codeField: string | undefined = this.fieldInfos.find(
			(l) => l.layerName === this.selectionViewState?.layerView?.layer?.title
		)?.codeField;
		if (!codeField) {
			console.warn(
				`SelectedAreasStore: No code field configured for layer ${this.selectionViewState.layerView.layer.title}`,
				this.fieldInfos
			);
			return null;
		}
		return codeField;
	}

	clearSelections(): void {
		this.resetSelectedAreas();
		this.clearHoveredArea();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
		console.log('[area-selection-store] selections cleared.');
	}

	cleanup(): void {
		this.resetSelectedAreas();
		this.clearHoveredArea();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
		this.cachedNames.clear();
		this.fieldInfos = [];

		console.log('[area-selection-store] cleaned up.');
	}
}
