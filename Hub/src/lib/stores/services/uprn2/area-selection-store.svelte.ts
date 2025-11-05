// import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
// import { SvelteMap, SvelteSet } from 'svelte/reactivity';

// export type AreaSelectionFieldInfo = {
// 	layerName: string;
// 	nameField: string;
// 	codeField: string;
// };

// export type SelectionViewState = {
// 	featureLayerView: __esri.FeatureLayerView | null;
// 	areaInfos: HighlightAreaInfo[];
// };

// export type HighlightAreaInfo = {
// 	id: number;
// 	handle: __esri.Handle;
// };

// /**
//  * Store for managing the selected areas.
//  */
// class AreaSelectionStore {
// 	public layer = $state<FeatureLayer | null>(null);
// 	public selectionViewState = $state<SelectionViewState>({
// 		featureLayerView: null,
// 		areaInfos: []
// 	});
// 	public lastAddedArea = $state<HighlightAreaInfo | null>(null);
// 	public lastRemovedArea = $state<HighlightAreaInfo | null>(null);
// 	public currentHoveredArea = $state<HighlightAreaInfo | null>(null);
// 	public areaSelectionLayerIds = $state<Set<string>>(new SvelteSet());

// 	#fieldInfo: AreaSelectionFieldInfo[] = [];
// 	#cachedNames: SvelteMap<string, Map<number, string>> = new SvelteMap<
// 		string,
// 		Map<number, string>
// 	>();

// 	setFieldInfo(fieldInfo: AreaSelectionFieldInfo[]): void {
// 		console.log('Setting field info:', fieldInfo);
// 		this.#fieldInfo = fieldInfo;
// 	}

// 	setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
// 		if (this.selectionViewState?.featureLayerView === layerView) {
// 			return;
// 		}

// 		if (this.selectionViewState) {
// 			// Clear existing highlights but don't reset the entire state
// 			this.selectionViewState.areaInfos.forEach((areaInfo) => {
// 				areaInfo.handle.remove();
// 			});
// 		}

// 		this.selectionViewState = {
// 			featureLayerView: layerView,
// 			areaInfos: []
// 		};
// 	}

// 	clearSelectedLayerView(): void {
// 		if (this.selectionViewState.featureLayerView === null) {
// 			return;
// 		}

// 		this.resetSelectedAreas();
// 		this.selectionViewState.featureLayerView = null;
// 	}

// 	resetSelectedAreas(): void {
// 		if (
// 			!this.selectionViewState.featureLayerView &&
// 			this.selectionViewState.areaInfos.length === 0
// 		) {
// 			return;
// 		}

// 		if (this.selectionViewState) {
// 			this.selectionViewState.areaInfos.forEach((areaInfo) => {
// 				areaInfo.handle.remove();
// 			});
// 		}

// 		this.layer = null;
// 		this.selectionViewState = {
// 			featureLayerView: null,
// 			areaInfos: []
// 		};
// 	}

// 	addSelectedArea(id: number, handle: __esri.Handle): void {
// 		if (!this.selectionViewState) {
// 			console.warn('SelectedAreasStore: No feature layer view is set.');
// 			return;
// 		}

// 		const areaInfo: HighlightAreaInfo = { id, handle };
// 		this.selectionViewState.areaInfos.push(areaInfo);
// 		this.lastAddedArea = areaInfo;
// 	}

// 	removeSelectedArea(id: number): void {
// 		if (!this.selectionViewState) {
// 			console.warn('SelectedAreasStore: No feature layer view is set.');
// 			return;
// 		}

// 		const index = this.selectionViewState.areaInfos.findIndex((areaInfo) => areaInfo.id === id);
// 		if (index === -1) {
// 			return;
// 		}

// 		this.lastRemovedArea = { id, handle: this.selectionViewState.areaInfos[index].handle };

// 		this.selectionViewState.areaInfos[index].handle.remove();
// 		this.selectionViewState.areaInfos.splice(index, 1);
// 	}

// 	async getAreaNamesById(ids: number[]): Promise<string[]> {
// 		if (!this.selectionViewState?.featureLayerView) return [];

// 		const nameField = this.getNameFieldForCurrentLayer();
// 		if (!nameField) return [];

// 		const layer = this.selectionViewState.featureLayerView.layer as __esri.FeatureLayer;

// 		let cache = this.#cachedNames.get(layer.uid);
// 		if (!cache) {
// 			cache = new SvelteMap<number, string>();
// 			this.#cachedNames.set(layer.uid, cache);
// 		}

// 		const names: (string | undefined)[] = new Array(ids.length);
// 		const idToIndex = new SvelteMap<number, number>();
// 		const missingIds: number[] = [];

// 		ids.forEach((id, idx) => {
// 			idToIndex.set(id, idx);
// 			const cached = cache.get(id);
// 			if (cached !== undefined) {
// 				names[idx] = cached;
// 			} else {
// 				missingIds.push(id);
// 			}
// 		});

// 		if (missingIds.length === 0) {
// 			return names.map((n) => n ?? '');
// 		}

// 		const objectIdField: string = layer.objectIdField;
// 		const result = await layer.queryFeatures({
// 			objectIds: missingIds,
// 			outFields: [nameField, objectIdField],
// 			returnGeometry: false
// 		});

// 		for (const feature of result.features) {
// 			const id = feature.attributes[objectIdField] as number;
// 			const name = feature.attributes[nameField] as string;
// 			const idx = idToIndex.get(id);
// 			if (idx !== undefined) {
// 				names[idx] = name ?? '';
// 				cache!.set(id, name ?? '');
// 			}
// 		}

// 		return names.map((n) => n ?? '');
// 	}

// 	async getAreaCodesById(ids: number[]): Promise<string[]> {
// 		if (!this.selectionViewState?.featureLayerView) return [];

// 		const codeField = this.getCodeFieldForCurrentLayer();
// 		if (!codeField) return [];

// 		const layer = this.selectionViewState.featureLayerView.layer as __esri.FeatureLayer;

// 		const objectIdField: string = layer.objectIdField;
// 		const result = await layer.queryFeatures({
// 			objectIds: ids,
// 			outFields: [codeField, objectIdField],
// 			returnGeometry: false
// 		});

// 		const codes: (string | undefined)[] = new Array(ids.length);
// 		for (const feature of result.features) {
// 			const id = feature.attributes[objectIdField] as number;
// 			const code = feature.attributes[codeField] as string;

// 			const index = ids.indexOf(id);
// 			if (index !== -1) {
// 				codes[index] = code ?? '';
// 			}
// 		}

// 		return codes.map((n) => n ?? '');
// 	}

// 	setHoveredArea(id: number, handle: __esri.Handle): void {
// 		if (this.currentHoveredArea) {
// 			this.clearHoveredArea();
// 		}

// 		this.currentHoveredArea = { id, handle };
// 	}

// 	clearHoveredArea(): void {
// 		if (!this.currentHoveredArea) {
// 			return;
// 		}

// 		this.currentHoveredArea?.handle.remove();
// 		this.currentHoveredArea = null;
// 	}

// 	getNameFieldForCurrentLayer(): string | null {
// 		if (
// 			!this.selectionViewState ||
// 			!this.selectionViewState.featureLayerView ||
// 			!this.selectionViewState.featureLayerView.layer
// 		) {
// 			return null;
// 		}

// 		const nameField: string | undefined = this.#fieldInfo.find(
// 			(l) => l.layerName === this.selectionViewState?.featureLayerView?.layer?.title
// 		)?.nameField;

// 		if (!nameField) {
// 			console.warn(
// 				`SelectedAreasStore: No name field configured for layer ${this.selectionViewState.featureLayerView.layer.title}`,
// 				this.#fieldInfo
// 			);
// 			return null;
// 		}

// 		return nameField;
// 	}

// 	getCodeFieldForCurrentLayer(): string | null {
// 		if (
// 			!this.selectionViewState ||
// 			!this.selectionViewState.featureLayerView ||
// 			!this.selectionViewState.featureLayerView.layer
// 		) {
// 			return null;
// 		}
// 		const codeField: string | undefined = this.#fieldInfo.find(
// 			(l) => l.layerName === this.selectionViewState?.featureLayerView?.layer?.title
// 		)?.codeField;
// 		if (!codeField) {
// 			console.warn(
// 				`SelectedAreasStore: No code field configured for layer ${this.selectionViewState.featureLayerView.layer.title}`,
// 				this.#fieldInfo
// 			);
// 			return null;
// 		}
// 		return codeField;
// 	}

// 	clearSelections(): void {
// 		this.resetSelectedAreas();
// 		this.clearHoveredArea();
// 		this.lastAddedArea = null;
// 		this.lastRemovedArea = null;
// 		this.currentHoveredArea = null;
// 		console.log('[area-selection-store] selections cleared.');
// 	}

// 	cleanup(): void {
// 		this.resetSelectedAreas();
// 		this.clearHoveredArea();
// 		this.lastAddedArea = null;
// 		this.lastRemovedArea = null;
// 		this.currentHoveredArea = null;
// 		this.#cachedNames.clear();
// 		this.#fieldInfo = [];

// 		console.log('[area-selection-store] cleaned up.');
// 	}
// }

// export const areaSelectionStore = new AreaSelectionStore();
// export type { AreaSelectionStore };
