import type { LayerViewProvider } from '$lib/services/layer-view-provider';
import { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
import { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
import { describe, expect, it, vi, type Mock } from 'vitest';

type FakeAreaLayer = {
	id: string;
	objectIdField: string;
	uid?: string;
	fields?: { name: string }[];
	fieldsIndex?: {
		get: Mock<(fieldName: string) => { name: string } | undefined>;
	};
	getField?: Mock<(fieldName: string) => { name: string } | undefined>;
	queryFeatures: Mock<(query: __esri.QueryProperties) => Promise<__esri.FeatureSet>>;
};

describe('AreaSelectionInteractionStore', () => {
	it('resolves parquet area name and code fields against uppercase runtime fields', async () => {
		const queryFeatures = vi.fn(async () => {
			return {
				features: [
					{
						attributes: {
							__OBJECTID: 12,
							BUA22NM: 'Manchester',
							BUA22CD: 'E63001234'
						}
					}
				]
			} as __esri.FeatureSet;
		});
		const layer = createFakeAreaLayer({
			objectIdField: '__OBJECTID',
			fields: [{ name: '__OBJECTID' }, { name: 'BUA22NM' }, { name: 'BUA22CD' }],
			getField: vi.fn((fieldName: string) => {
				const fieldsByLowerName = new Map([
					['bua22nm', { name: 'BUA22NM' }],
					['bua22cd', { name: 'BUA22CD' }]
				]);
				return fieldsByLowerName.get(fieldName.toLowerCase());
			}),
			queryFeatures
		});
		const store = createAreaSelectionInteractionStore(layer, {
			nameField: 'bua22nm',
			codeField: 'bua22cd'
		});

		await expect(store.getAreaNamesByLayerId('area-layer', [12])).resolves.toEqual(['Manchester']);
		await expect(store.getAreaCodesByLayerId('area-layer', [12])).resolves.toEqual(['E63001234']);

		expect(queryFeatures).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				objectIds: [12],
				outFields: ['BUA22NM', '__OBJECTID'],
				returnGeometry: false
			})
		);
		expect(queryFeatures).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				objectIds: [12],
				outFields: ['BUA22CD', '__OBJECTID'],
				returnGeometry: false
			})
		);
	});

	it('keeps exact lowercase feature layer field lookups unchanged', async () => {
		const queryFeatures = vi.fn(async () => {
			return {
				features: [
					{
						attributes: {
							objectid: 34,
							tilename: 'tile-001'
						}
					}
				]
			} as __esri.FeatureSet;
		});
		const layer = createFakeAreaLayer({
			objectIdField: 'objectid',
			fields: [{ name: 'objectid' }, { name: 'tilename' }],
			queryFeatures
		});
		const store = createAreaSelectionInteractionStore(layer, {
			nameField: 'tilename',
			codeField: 'tilename'
		});

		await expect(store.getAreaNamesByLayerId('area-layer', [34])).resolves.toEqual(['tile-001']);
		await expect(store.getAreaCodesByLayerId('area-layer', [34])).resolves.toEqual(['tile-001']);

		expect(queryFeatures).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				objectIds: [34],
				outFields: ['tilename', 'objectid'],
				returnGeometry: false
			})
		);
		expect(queryFeatures).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				objectIds: [34],
				outFields: ['tilename', 'objectid'],
				returnGeometry: false
			})
		);
	});
});

function createFakeAreaLayer(overrides: Partial<FakeAreaLayer>): FakeAreaLayer {
	return {
		id: 'area-layer',
		objectIdField: 'objectid',
		queryFeatures: vi.fn(),
		...overrides
	};
}

function createAreaSelectionInteractionStore(
	layer: FakeAreaLayer,
	fieldInfo: { nameField: string; codeField: string }
): AreaSelectionInteractionStore {
	const layerViewProvider = {
		getLayerById: vi.fn((layerId: string) =>
			layerId === layer.id ? (layer as unknown as __esri.Layer) : undefined
		)
	} as unknown as LayerViewProvider;

	return new AreaSelectionInteractionStore(
		new AreaSelectionStore(),
		layerViewProvider,
		[
			{
				id: layer.id,
				nameField: fieldInfo.nameField,
				codeField: fieldInfo.codeField
			}
		],
		null
	);
}
