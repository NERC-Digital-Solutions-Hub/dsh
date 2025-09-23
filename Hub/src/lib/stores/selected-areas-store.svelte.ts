export type LayerNameField = {
	layerName: string;
	field: string;
};

export type SelectState = {
	featureLayerView: __esri.FeatureLayerView | null;
	highlightHandles: HandleInfo[];
};

export type HandleInfo = {
	id: number;
	handle: __esri.Handle;
};

/**
 * Store for managing the selected areas.
 */
class SelectedAreasStore {
	public data = $state<SelectState>({ featureLayerView: null, highlightHandles: [] });
	public lastAddedHandle = $state<HandleInfo | null>(null);
	public lastRemovedHandle = $state<HandleInfo | null>(null);
	public hoveredHandle = $state<HandleInfo | null>(null);

	#layerNameFields: LayerNameField[] = [];

	setLayerNameFields(layerNameFields: LayerNameField[]): void {
		this.#layerNameFields = layerNameFields;
	}

	setSelectedLayerView(layerView: __esri.FeatureLayerView): void {
		if (this.data) {
			this.resetSelectedAreas();
		}

		this.data = {
			featureLayerView: layerView,
			highlightHandles: []
		};
	}

	resetSelectedAreas(): void {
		if (this.data) {
			this.data.highlightHandles.forEach((handleInfo) => {
				handleInfo.handle.remove();
			});
		}

		this.data = {
			featureLayerView: null,
			highlightHandles: []
		};
	}

	addSelectedArea(id: number, handle: __esri.Handle): void {
		if (!this.data) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		this.data.highlightHandles.push({ id, handle });
		this.lastAddedHandle = { id, handle };
	}

	removeSelectedArea(id: number): void {
		if (!this.data) {
			console.warn('SelectedAreasStore: No feature layer view is set.');
			return;
		}

		const index = this.data.highlightHandles.findIndex((h) => h.id === id);
		if (index !== -1) {
			this.lastRemovedHandle = { id, handle: this.data.highlightHandles[index].handle };

			this.data.highlightHandles[index].handle.remove();
			this.data.highlightHandles.splice(index, 1);
		}
	}

	async getAreaNamesById(ids: number[]): Promise<string[] | null> {
		if (!this.data || !this.data.featureLayerView) {
			return null;
		}
		const nameField: string | undefined = this.#layerNameFields.find(
			(l) => l.layerName === this.data?.featureLayerView?.layer.title
		)?.field;

		if (!nameField) {
			console.warn(
				`SelectedAreasStore: No name field configured for layer ${this.data.featureLayerView.layer.title}.`
			);
			return null;
		}

		const layer = this.data.featureLayerView.layer as __esri.FeatureLayer;
		const result = await layer.queryFeatures({
			where: '1=1',
			objectIds: ids,
			outFields: [nameField]
		});
		if (result.features.length === 0) {
			return null;
		}

		return result.features.map((feature) => feature.attributes[nameField] as string);
	}

	async listSelectedAreaNames(): Promise<string[]> {
		if (!this.data || !this.data.featureLayerView || this.data.highlightHandles.length === 0) {
			return [];
		}

		const nameField: string | undefined = this.#layerNameFields.find(
			(l) => l.layerName === this.data?.featureLayerView?.layer.title
		)?.field;
		if (!nameField) {
			console.warn(
				`SelectedAreasStore: No name field configured for layer ${this.data.featureLayerView.layer.title}.`
			);
			return [];
		}

		const layer = this.data.featureLayerView.layer as __esri.FeatureLayer;
		const selectedNames: string[] = [];

		const objectIds: number[] = this.data.highlightHandles.map((h) => h.id);
		const result = await layer.queryFeatures({
			where: `1=1`,
			objectIds: objectIds,
			outFields: [nameField]
		});

		result.features.forEach((feature) => {
			selectedNames.push(feature.attributes[nameField]);
		});

		return selectedNames;
	}
}

export const selectedAreasStore = new SelectedAreasStore();
