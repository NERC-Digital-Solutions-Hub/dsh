import { NodeDrawState, TreeviewNode } from '$lib/Models/Treeview/Index';
import { ArcgisNodeVisibilityRenderer } from '$lib/Services/ArcgisNodeVisibilityRenderer';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@arcgis/core/core/reactiveUtils.js', () => ({
	watch: vi.fn(() => ({ remove: vi.fn() }))
}));
vi.mock('@dsh/common/arcgis', () => ({
	arcgisImport: vi.fn(async (specifier: string) => {
		if (specifier !== '@arcgis/core/core/reactiveUtils.js') {
			throw new Error(`Unexpected ArcGIS module import: ${specifier}`);
		}

		return {
			watch: vi.fn(() => ({ remove: vi.fn() }))
		};
	}),
	loadArcgis: vi.fn(async () => {}),
	preloadArcgis: vi.fn(async () => {})
}));

type FakeLayer = {
	id: string;
	parent: FakeGroupLayer | null;
	type: string;
	visible: boolean;
	__uprnParquetLayer?: boolean;
};

type FakeGroupLayer = FakeLayer & {
	layers: FakeLayer[];
	type: 'group';
};

type FakeLayerView = {
	layer: __esri.Layer;
	suspended: boolean;
	visible: boolean;
};

describe('ArcgisNodeVisibilityRenderer', () => {
	it('toggles parquet source layers without forcing a layer view', async () => {
		const { groupLayer, layer } = createLayerFixture('parquet');
		const provider = createLayerViewProvider(layer);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('node', 'Node'),
			target: {
				kind: 'source',
				nodeId: 'node',
				sourceId: layer.id,
				drawStateNodeId: 'node'
			},
			isVisible: true,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(layer.visible).toBe(true);
		expect(groupLayer.visible).toBe(true);
		expect(provider.getLayerView).not.toHaveBeenCalled();
		expect(drawState).toBe(NodeDrawState.Visible);

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('node', 'Node'),
			target: {
				kind: 'source',
				nodeId: 'node',
				sourceId: layer.id,
				drawStateNodeId: 'node'
			},
			isVisible: false,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(layer.visible).toBe(false);
		expect(groupLayer.visible).toBe(false);
		expect(drawState).toBeUndefined();
	});

	it('keeps layer-view draw-state tracking for non-parquet source layers', async () => {
		const { groupLayer, layer } = createLayerFixture('feature');
		const layerView: FakeLayerView = {
			layer: layer as unknown as __esri.Layer,
			suspended: false,
			visible: false
		};
		const provider = createLayerViewProvider(layer, layerView);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('node', 'Node'),
			target: {
				kind: 'source',
				nodeId: 'node',
				sourceId: layer.id,
				drawStateNodeId: 'node'
			},
			isVisible: true,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(layer.visible).toBe(true);
		expect(groupLayer.visible).toBe(true);
		expect(provider.getLayerView).toHaveBeenCalledWith(layer);
		expect(layerView.visible).toBe(true);
		expect(drawState).toBe(NodeDrawState.Visible);
	});

	it('hides non-parquet source layer views when source layers are hidden', async () => {
		const { groupLayer, layer } = createLayerFixture('feature');
		groupLayer.visible = true;
		layer.visible = true;
		const layerView: FakeLayerView = {
			layer: layer as unknown as __esri.Layer,
			suspended: false,
			visible: true
		};
		const provider = createLayerViewProvider(layer, layerView);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined = NodeDrawState.Visible;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('node', 'Node'),
			target: {
				kind: 'source',
				nodeId: 'node',
				sourceId: layer.id,
				drawStateNodeId: 'node'
			},
			isVisible: false,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(layer.visible).toBe(false);
		expect(groupLayer.visible).toBe(false);
		expect(provider.getLayerView).toHaveBeenCalledWith(layer);
		expect(layerView.visible).toBe(false);
		expect(drawState).toBeUndefined();
	});

	it('applies parquet dependency visibility directly', async () => {
		const { groupLayer, layer } = createLayerFixture('parquet');
		const provider = createLayerViewProvider(layer);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);

		await renderer.applyDependencyVisibility({
			sourceNode: new TreeviewNode('source-node', 'Source node'),
			dependentNode: new TreeviewNode('dependent-node', 'Dependent node'),
			target: {
				kind: 'source',
				nodeId: 'dependent-node',
				sourceId: layer.id,
				drawStateNodeId: 'dependent-node'
			},
			isVisible: true
		});

		expect(layer.visible).toBe(true);
		expect(groupLayer.visible).toBe(true);
		expect(provider.getLayerView).not.toHaveBeenCalled();
	});

	it('treats parquet source-member targets as the owning layer', async () => {
		const { layer } = createLayerFixture('parquet');
		const provider = createLayerViewProvider(layer);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('variable-node', 'Variable node'),
			target: {
				kind: 'source-member',
				nodeId: 'variable-node',
				sourceId: layer.id,
				memberId: '0',
				drawStateNodeId: 'variable-node'
			},
			isVisible: true,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(layer.visible).toBe(true);
		expect(provider.getLayerView).not.toHaveBeenCalled();
		expect(drawState).toBe(NodeDrawState.Visible);
	});

	it('toggles parquet child layers for group source-member targets', async () => {
		const { childLayer, groupLayer } = createGroupMemberFixture({
			childId: 'parent-0',
			childType: 'graphics',
			childIsParquet: true
		});
		const provider = createLayerViewProvider([groupLayer, childLayer]);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('variable-node', 'Variable node'),
			target: {
				kind: 'source-member',
				nodeId: 'variable-node',
				sourceId: groupLayer.id,
				memberId: '0',
				drawStateNodeId: 'variable-node'
			},
			isVisible: true,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(childLayer.visible).toBe(true);
		expect(groupLayer.visible).toBe(true);
		expect(provider.getLayerView).not.toHaveBeenCalled();
		expect(drawState).toBe(NodeDrawState.Visible);
	});

	it('hides parquet child layers for group source-member targets', async () => {
		const { childLayer, groupLayer } = createGroupMemberFixture({
			childId: 'parent-0',
			childType: 'graphics',
			childIsParquet: true,
			childVisible: true,
			groupVisible: true
		});
		const provider = createLayerViewProvider([groupLayer, childLayer]);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);
		let drawState: NodeDrawState | undefined = NodeDrawState.Visible;

		await renderer.applyVisibility({
			sourceNode: new TreeviewNode('variable-node', 'Variable node'),
			target: {
				kind: 'source-member',
				nodeId: 'variable-node',
				sourceId: groupLayer.id,
				memberId: '0',
				drawStateNodeId: 'variable-node'
			},
			isVisible: false,
			setDrawState: (nextDrawState) => {
				drawState = nextDrawState;
			}
		});

		expect(childLayer.visible).toBe(false);
		expect(groupLayer.visible).toBe(false);
		expect(provider.getLayerView).not.toHaveBeenCalled();
		expect(drawState).toBeUndefined();
	});

	it('applies dependency visibility to parquet child layers under group source-member targets', async () => {
		const { childLayer, groupLayer } = createGroupMemberFixture({
			childId: 'parent-15',
			childType: 'graphics',
			childIsParquet: true
		});
		const provider = createLayerViewProvider([groupLayer, childLayer]);
		const renderer = new ArcgisNodeVisibilityRenderer(provider as unknown as LayerViewProvider);

		await renderer.applyDependencyVisibility({
			sourceNode: new TreeviewNode('source-node', 'Source node'),
			dependentNode: new TreeviewNode('dependent-node', 'Dependent node'),
			target: {
				kind: 'source-member',
				nodeId: 'dependent-node',
				sourceId: groupLayer.id,
				memberId: '15',
				drawStateNodeId: 'dependent-node'
			},
			isVisible: true
		});

		expect(childLayer.visible).toBe(true);
		expect(groupLayer.visible).toBe(true);
		expect(provider.getLayerView).not.toHaveBeenCalled();
	});
});

function createLayerFixture(type: string) {
	const groupLayer: FakeGroupLayer = {
		id: 'group-layer',
		layers: [],
		parent: null,
		type: 'group',
		visible: false
	};
	const layer: FakeLayer = {
		id: `${type}-layer`,
		parent: groupLayer,
		type,
		visible: false
	};

	groupLayer.layers.push(layer);

	return { groupLayer, layer };
}

function createGroupMemberFixture(options: {
	childId: string;
	childType: string;
	childIsParquet?: boolean;
	childVisible?: boolean;
	groupVisible?: boolean;
}) {
	const groupLayer: FakeGroupLayer = {
		id: 'parent',
		layers: [],
		parent: null,
		type: 'group',
		visible: options.groupVisible ?? false
	};
	const childLayer: FakeLayer = {
		id: options.childId,
		parent: groupLayer,
		type: options.childType,
		visible: options.childVisible ?? false,
		__uprnParquetLayer: options.childIsParquet
	};

	groupLayer.layers.push(childLayer);

	return { childLayer, groupLayer };
}

function createLayerViewProvider(layers: FakeLayer | FakeLayer[], layerView?: FakeLayerView) {
	const layerList = Array.isArray(layers) ? layers : [layers];

	return {
		getLayerById: vi.fn(
			(layerId: string) =>
				layerList.find((layer) => layer.id === layerId) as unknown as __esri.Layer | undefined
		),
		getLayerView: vi.fn((requestedLayer: __esri.Layer) =>
			Promise.resolve(requestedLayer === layerList[0] ? (layerView as __esri.LayerView) : undefined)
		),
		getLayerViewById: vi.fn((layerId: string) =>
			Promise.resolve(layerId === layerList[0].id ? (layerView as __esri.LayerView) : undefined)
		)
	};
}
