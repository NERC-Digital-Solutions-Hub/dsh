import { SvelteMap } from 'svelte/reactivity';

export type LayerNameField = {
	layerName: string;
	field: string;
};

export type LayerHighlightState = {
	featureLayerView: __esri.FeatureLayerView | null;
	areaInfos: HighlightAreaInfo[];
};

export type HighlightAreaInfo = {
	id: number;
	handle: __esri.Handle;
};

/**
 * Store for managing the selected areas.
 */
class AreaSelectionStore {
	public layerHighlightState = $state<LayerHighlightState>({
		featureLayerView: null,
		areaInfos: []
	});
	public lastAddedArea = $state<HighlightAreaInfo | null>(null);
	public lastRemovedArea = $state<HighlightAreaInfo | null>(null);
	public currentHoveredArea = $state<HighlightAreaInfo | null>(null);

	#nameFields: LayerNameField[] = [];
	#cachedNames: SvelteMap<string, Map<number, string>> = new SvelteMap<
		string,
		Map<number, string>
	>();

	setNameFields(nameFields: LayerNameField[]): void {
		console.log('Setting name fields:', nameFields);
		this.#nameFields = nameFields;
	}

	setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		if (this.layerHighlightState?.featureLayerView === layerView) {
			return;
		}

		if (this.layerHighlightState) {
			// Clear existing highlights but don't reset the entire state
			this.layerHighlightState.areaInfos.forEach((areaInfo) => {
				areaInfo.handle.remove();
			});
		}

		this.layerHighlightState = {
			featureLayerView: layerView,
			areaInfos: []
		};
	}

	clearSelectedLayerView(): void {
		if (this.layerHighlightState.featureLayerView === null) {
			return;
		}

		this.resetSelectedAreas();
		this.layerHighlightState.featureLayerView = null;
	}

	resetSelectedAreas(): void {
		if (
			!this.layerHighlightState.featureLayerView &&
			this.layerHighlightState.areaInfos.length === 0
		) {
			return;
		}

		if (this.layerHighlightState) {
			this.layerHighlightState.areaInfos.forEach((areaInfo) => {
				areaInfo.handle.remove();
			});
		}

		this.layerHighlightState = {
			featureLayerView: null,
			areaInfos: []
		};
	}

	addSelectedArea(id: number, handle: __esri.Handle): void {
		if (!this.layerHighlightState) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const areaInfo: HighlightAreaInfo = { id, handle };
		this.layerHighlightState.areaInfos.push(areaInfo);
		this.lastAddedArea = areaInfo;
	}

	removeSelectedArea(id: number): void {
		if (!this.layerHighlightState) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const index = this.layerHighlightState.areaInfos.findIndex((areaInfo) => areaInfo.id === id);
		if (index === -1) {
			return;
		}

		this.lastRemovedArea = { id, handle: this.layerHighlightState.areaInfos[index].handle };

		this.layerHighlightState.areaInfos[index].handle.remove();
		this.layerHighlightState.areaInfos.splice(index, 1);
	}

	async getAreaNamesById(ids: number[]): Promise<string[]> {
		if (!this.layerHighlightState?.featureLayerView) return [];

		const nameField = this.getNameFieldForCurrentLayer();
		if (!nameField) return [];

		const layer = this.layerHighlightState.featureLayerView.layer as __esri.FeatureLayer;

		let cache = this.#cachedNames.get(layer.uid);
		if (!cache) {
			cache = new SvelteMap<number, string>();
			this.#cachedNames.set(layer.uid, cache);
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

	setHoveredArea(id: number, handle: __esri.Handle): void {
		if (this.currentHoveredArea) {
			this.clearHoveredArea();
		}

		this.currentHoveredArea = { id, handle };
	}

	clearHoveredArea(): void {
		if (!this.currentHoveredArea) {
			return;
		}

		this.currentHoveredArea?.handle.remove();
		this.currentHoveredArea = null;
	}

	getNameFieldForCurrentLayer(): string | null {
		if (
			!this.layerHighlightState ||
			!this.layerHighlightState.featureLayerView ||
			!this.layerHighlightState.featureLayerView.layer
		) {
			return null;
		}

		const nameField: string | undefined = this.#nameFields.find(
			(l) => l.layerName === this.layerHighlightState?.featureLayerView?.layer?.title
		)?.field;

		if (!nameField) {
			console.warn(
				`SelectedAreasStore: No name field configured for layer ${this.layerHighlightState.featureLayerView.layer.title}`,
				this.#nameFields
			);
			return null;
		}

		return nameField;
	}

	cleanup(): void {
		this.resetSelectedAreas();
		this.clearHoveredArea();
		this.lastAddedArea = null;
		this.lastRemovedArea = null;
		this.currentHoveredArea = null;
		this.#cachedNames.clear();
		this.#nameFields = [];

		console.log('[area-selection-store] cleaned up.');
	}
}

export const areaSelectionStore = new AreaSelectionStore();
