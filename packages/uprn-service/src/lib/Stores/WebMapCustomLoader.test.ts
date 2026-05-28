import { createWebMapFromJson, getOriginalLayerId } from '$lib/Stores/WebMapCustomLoader';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const arcgis = vi.hoisted(() => {
	class FakeCollection<T extends { parent?: unknown }> {
		public readonly items: T[] = [];

		constructor(items: T[] = []) {
			items.forEach((item) => this.add(item));
		}

		public add(item: T, index?: number): void {
			if (index === undefined) {
				this.items.push(item);
				return;
			}

			this.items.splice(index, 0, item);
		}

		public remove(item: T): void {
			const index = this.items.indexOf(item);
			if (index !== -1) {
				this.items.splice(index, 1);
			}
		}

		public splice(start: number, deleteCount: number, ...items: T[]): void {
			this.items.splice(start, deleteCount, ...items);
		}

		public toArray(): T[] {
			return [...this.items];
		}

		public forEach(callback: (item: T) => void): void {
			this.items.forEach(callback);
		}

		public map<TResult>(callback: (item: T) => TResult): TResult[] {
			return this.items.map(callback);
		}

		public get length(): number {
			return this.items.length;
		}

		public [Symbol.iterator](): Iterator<T> {
			return this.items[Symbol.iterator]();
		}
	}

	class FakeWebMap {
		public static readonly fromJsonCalls: unknown[] = [];
		public readonly layers = new FakeCollection<FakeLayer>();
		public readonly json?: unknown;
		public basemap?: unknown;

		constructor(properties: { json?: unknown } = {}) {
			this.json = properties.json;
		}

		public static fromJSON(json: unknown): FakeWebMap {
			FakeWebMap.fromJsonCalls.push(json);
			return new FakeWebMap({ json });
		}
	}

	class FakeLayer {
		public readonly id: string;
		public readonly type: string;
		public readonly title?: string;
		public readonly minScale?: number;
		public readonly maxScale?: number;
		public readonly sublayers?: FakeLayer[];
		public parent?: FakeLayer;
		readonly #watchers = new Map<string, Array<(value: unknown) => void>>();
		#visible?: boolean;

		constructor(properties: Record<string, unknown>) {
			this.id = String(properties.id);
			this.type = String(properties.type);
			this.title = typeof properties.title === 'string' ? properties.title : undefined;
			this.minScale = typeof properties.minScale === 'number' ? properties.minScale : undefined;
			this.maxScale = typeof properties.maxScale === 'number' ? properties.maxScale : undefined;
			this.#visible = typeof properties.visible === 'boolean' ? properties.visible : undefined;
			this.sublayers = Array.isArray(properties.sublayers)
				? properties.sublayers.map((sublayer) => new FakeLayer({ ...sublayer, type: 'sublayer' }))
				: undefined;
			this.sublayers?.forEach((sublayer) => {
				sublayer.parent = this;
			});
		}

		public get visible(): boolean | undefined {
			return this.#visible;
		}

		public set visible(value: boolean | undefined) {
			this.#visible = value;
			this.#watchers.get('visible')?.forEach((callback) => callback(value));
		}

		public watch(property: string, callback: (value: unknown) => void): { remove: () => void } {
			const watchers = this.#watchers.get(property) ?? [];
			watchers.push(callback);
			this.#watchers.set(property, watchers);

			return {
				remove: () => {
					const current = this.#watchers.get(property) ?? [];
					this.#watchers.set(
						property,
						current.filter((item) => item !== callback)
					);
				}
			};
		}

		public static fromJSON(json: Record<string, unknown>): FakeLayer {
			return new FakeLayer({
				...json,
				type: getLayerType(json.layerType)
			});
		}
	}

	class FakeGroupLayer extends FakeLayer {
		public readonly layers: FakeCollection<FakeLayer>;
		public readonly visibilityMode?: string;

		constructor(properties: Record<string, unknown>) {
			super({ ...properties, type: 'group' });
			const layers = Array.isArray(properties.layers) ? (properties.layers as FakeLayer[]) : [];
			this.layers = new FakeCollection(layers);
			this.visibilityMode =
				typeof properties.visibilityMode === 'string' ? properties.visibilityMode : undefined;
			this.layers.forEach((layer) => {
				layer.parent = this;
			});
		}
	}

	class FakeParquetLayer extends FakeLayer {
		public readonly urls: string[];
		public readonly renderer?: unknown;
		public readonly fields?: unknown[];
		public readonly geometryType?: unknown;
		public readonly spatialReference?: unknown;
		public readonly geometryEncoding?: { toJSON(): Record<string, unknown> };
		public readonly popupTemplate?: unknown;
		public readonly popupEnabled?: boolean;
		public readonly opacity?: number;
		public readonly minScale?: number;
		public readonly maxScale?: number;

		constructor(properties: Record<string, unknown>) {
			super({ ...properties, type: 'parquet' });
			this.urls = Array.isArray(properties.urls) ? (properties.urls as string[]) : [];
			this.renderer = properties.renderer;
			this.fields = Array.isArray(properties.fields) ? properties.fields : undefined;
			this.geometryType = properties.geometryType;
			this.spatialReference = properties.spatialReference;
			this.geometryEncoding = properties.geometryEncoding as
				| { toJSON(): Record<string, unknown> }
				| undefined;
			this.popupTemplate = properties.popupTemplate;
			this.popupEnabled =
				typeof properties.popupEnabled === 'boolean' ? properties.popupEnabled : undefined;
			this.opacity = typeof properties.opacity === 'number' ? properties.opacity : undefined;
			this.minScale = typeof properties.minScale === 'number' ? properties.minScale : undefined;
			this.maxScale = typeof properties.maxScale === 'number' ? properties.maxScale : undefined;
		}
	}

	class FakeParquetGeometryEncodingWkb {
		public readonly field?: string;
		public readonly orientation?: string;

		constructor(properties: Record<string, unknown>) {
			this.field = typeof properties.field === 'string' ? properties.field : undefined;
			this.orientation =
				typeof properties.orientation === 'string' ? properties.orientation : undefined;
		}

		public toJSON(): Record<string, unknown> {
			return {
				type: 'wkb',
				field: this.field,
				...(this.orientation ? { orientation: this.orientation } : {})
			};
		}
	}

	class FakeExtent {
		constructor(public readonly properties: Record<string, unknown>) {}
	}

	class FakeMapImageLayer extends FakeLayer {
		constructor(properties: Record<string, unknown>) {
			super({ ...properties, type: 'map-image' });
		}

		public static fromJSON(json: Record<string, unknown>): FakeMapImageLayer {
			return new FakeMapImageLayer(json);
		}
	}

	class FakeGraphicsLayer extends FakeLayer {
		constructor(properties: Record<string, unknown>) {
			super({ ...properties, type: 'graphics' });
		}
	}

	function getLayerType(layerType: unknown): string {
		switch (layerType) {
			case 'MapImageLayer':
			case 'ArcGISMapServiceLayer':
				return 'map-image';
			case 'FeatureLayer':
				return 'feature';
			case 'VectorTileLayer':
				return 'vector-tile';
			default:
				return typeof layerType === 'string' ? layerType : 'unknown';
		}
	}

	return {
		FakeCollection,
		FakeExtent,
		FakeGraphicsLayer,
		FakeGroupLayer,
		FakeLayer,
		FakeMapImageLayer,
		FakeParquetGeometryEncodingWkb,
		FakeParquetLayer,
		FakeWebMap,
		getParquetLayerInfo: vi.fn(),
		rendererFromJSON: vi.fn((renderer: Record<string, unknown>) => ({
			...renderer,
			converted: true
		}))
	};
});

vi.mock('@arcgis/core/WebMap', () => ({ default: arcgis.FakeWebMap }));
vi.mock('@arcgis/core/layers/Layer', () => ({ default: arcgis.FakeLayer }));
vi.mock('@arcgis/core/layers/GroupLayer', () => ({ default: arcgis.FakeGroupLayer }));
vi.mock('@arcgis/core/layers/GraphicsLayer', () => ({ default: arcgis.FakeGraphicsLayer }));
vi.mock('@arcgis/core/layers/MapImageLayer', () => ({ default: arcgis.FakeMapImageLayer }));
vi.mock('@arcgis/core/layers/ParquetLayer', () => ({ default: arcgis.FakeParquetLayer }));
vi.mock('@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js', () => ({
	default: arcgis.FakeParquetGeometryEncodingWkb
}));
vi.mock('@arcgis/core/geometry/Extent.js', () => ({ default: arcgis.FakeExtent }));
vi.mock('@arcgis/core/layers/support/parquetUtils.js', () => ({
	getParquetLayerInfo: arcgis.getParquetLayerInfo
}));
vi.mock('@arcgis/core/core/reactiveUtils.js', () => ({ watch: undefined }));
vi.mock('@arcgis/core/renderers/support/jsonUtils.js', () => ({
	fromJSON: arcgis.rendererFromJSON
}));

describe('WebMapCustomLoader', () => {
	beforeEach(() => {
		arcgis.FakeWebMap.fromJsonCalls.length = 0;
		arcgis.getParquetLayerInfo.mockReset();
		arcgis.getParquetLayerInfo.mockImplementation(async (urls: string[]) =>
			createParquetLayerInfo(urls[0])
		);
		arcgis.rendererFromJSON.mockClear();
	});

	it('creates placeholders for hidden parquet layers and hydrates them when shown', async () => {
		const webmap = await createWebMapFromJson(createWebmapFixture());
		const [firstGroup, secondGroup, mapImageLayer] = Array.from(
			webmap.layers as Iterable<unknown>
		) as [
			InstanceType<typeof arcgis.FakeGroupLayer>,
			InstanceType<typeof arcgis.FakeGroupLayer>,
			InstanceType<typeof arcgis.FakeMapImageLayer>
		];
		const firstParquetLayer = firstGroup.layers.items[0] as InstanceType<
			typeof arcgis.FakeGraphicsLayer
		>;
		const secondParquetLayer = secondGroup.layers.items[0] as InstanceType<
			typeof arcgis.FakeGraphicsLayer
		>;

		expect(webmap.layers.map((layer) => layer.id)).toEqual([
			'group-a',
			'group-b',
			'map-image-layer'
		]);
		expect(firstParquetLayer).toBeInstanceOf(arcgis.FakeGraphicsLayer);
		expect(firstParquetLayer.id).toBe('group-a-0');
		expect(firstParquetLayer.title).toBe('Air quality 2019');
		expect(firstParquetLayer.visible).toBe(false);
		expect(firstParquetLayer.minScale).toBe(10);
		expect(firstParquetLayer.maxScale).toBe(20);
		expect(arcgis.getParquetLayerInfo).not.toHaveBeenCalled();
		expect(getOriginalLayerId(firstParquetLayer as unknown as __esri.Layer)).toBe('0');
		expect(secondParquetLayer).toBeInstanceOf(arcgis.FakeGraphicsLayer);
		expect(secondParquetLayer.id).toBe('group-b-0');
		expect(mapImageLayer.sublayers?.[0].id).toBe('2');

		firstParquetLayer.visible = true;
		await flushPromises();

		const hydratedLayer = firstGroup.layers.items[0] as InstanceType<
			typeof arcgis.FakeParquetLayer
		>;

		expect(hydratedLayer).toBeInstanceOf(arcgis.FakeParquetLayer);
		expect(hydratedLayer.id).toBe('group-a-0');
		expect(hydratedLayer.title).toBe('Air quality 2019');
		expect(hydratedLayer.visible).toBe(true);
		expect(hydratedLayer.urls).toEqual(['https://example.test/air-quality-2019.parquet']);
		expect(hydratedLayer.renderer).toEqual({ type: 'simple', converted: true });
		expect(arcgis.rendererFromJSON).toHaveBeenCalledWith({ type: 'simple' });
		expect(arcgis.getParquetLayerInfo).toHaveBeenCalledTimes(1);
		expect(hydratedLayer.fields).toEqual(createParquetLayerInfo().fields);
		expect(hydratedLayer.geometryType).toBe('polygon');
		expect(hydratedLayer.spatialReference).toEqual({ wkid: 4326 });
		expect(hydratedLayer.geometryEncoding).toBeInstanceOf(arcgis.FakeParquetGeometryEncodingWkb);
		expect(hydratedLayer.geometryEncoding?.toJSON()).toEqual({
			type: 'wkb',
			field: 'Shape'
		});
		expect(hydratedLayer.popupTemplate).toEqual({
			title: 'GeoParquet feature',
			content: [
				{
					type: 'fields',
					fieldInfos: [{ fieldName: 'value', label: 'value' }]
				}
			]
		});
		expect(getOriginalLayerId(hydratedLayer as unknown as __esri.Layer)).toBe('0');
	});

	it('preflights parquet schema through the GeoParquet pipeline before constructing the layer', async () => {
		const layer = await createSingleParquetLayer('https://example.test/polygon.parquet');

		expect(layer.fields).toEqual(createParquetLayerInfo().fields);
		expect(layer.geometryType).toBe('polygon');
		expect(layer.geometryEncoding?.toJSON()).toEqual({
			type: 'wkb',
			field: 'Shape'
		});
		expect(layer.spatialReference).toEqual({ wkid: 4326 });
		expect(arcgis.getParquetLayerInfo).toHaveBeenCalledWith([
			'https://example.test/polygon.parquet'
		]);
	});

	it('uses pipeline metadata instead of migrated webmap parquet geometry hints', async () => {
		const webmap = await createWebMapFromJson({
			operationalLayers: [
				{
					id: 'explicit-parquet',
					title: 'Explicit parquet',
					layerType: 'ParquetLayer',
					url: 'https://example.test/explicit.parquet',
					visibility: true,
					layerDefinition: {
						geometryEncoding: {
							type: 'wkb',
							field: 'Shape'
						},
						geometryType: 'esriGeometryPolygon',
						spatialReference: { wkid: 3857 }
					}
				}
			]
		});
		const layer = Array.from(webmap.layers as Iterable<unknown>)[0] as InstanceType<
			typeof arcgis.FakeParquetLayer
		>;

		expect(layer.spatialReference).toEqual({ wkid: 4326 });
		expect(layer.geometryType).toBe('polygon');
		expect(layer.geometryEncoding?.toJSON()).toEqual({
			type: 'wkb',
			field: 'Shape'
		});
	});

	it('uses WGS84 even when migrated layer names mention older EPSG codes', async () => {
		const layer = await createSingleParquetLayer(
			'https://example.test/boundaries__EPSG_27700.parquet'
		);

		expect(layer.spatialReference).toEqual({ wkid: 4326 });
	});

	it('ignores unsupported parquet spatial references that ArcGIS cannot load', async () => {
		const webmap = await createWebMapFromJson({
			operationalLayers: [
				{
					id: 'bng-parquet',
					title: 'BNG parquet',
					layerType: 'ParquetLayer',
					url: 'https://example.test/boundaries__EPSG_27700.parquet',
					visibility: true,
					layerDefinition: {
						spatialReference: { wkid: 27700 }
					}
				}
			]
		});
		const layer = Array.from(webmap.layers as Iterable<unknown>)[0] as InstanceType<
			typeof arcgis.FakeParquetLayer
		>;

		expect(layer.spatialReference).toEqual({ wkid: 4326 });
	});

	it('falls back to WGS84 when no spatial reference can be inferred', async () => {
		const layer = await createSingleParquetLayer(
			'https://example.test/no-spatial-reference.parquet'
		);

		expect(layer.spatialReference).toEqual({ wkid: 4326 });
	});

	it('caches parquet metadata for repeated URLs', async () => {
		await createWebMapFromJson({
			operationalLayers: [
				{
					id: 'first',
					title: 'First parquet',
					layerType: 'ParquetLayer',
					url: 'https://example.test/shared.parquet',
					visibility: true
				},
				{
					id: 'second',
					title: 'Second parquet',
					layerType: 'ParquetLayer',
					url: 'https://example.test/shared.parquet',
					visibility: true
				}
			]
		});

		expect(arcgis.getParquetLayerInfo).toHaveBeenCalledTimes(1);
	});

	it('creates a usable parquet layer with pipeline-derived GeoParquet metadata', async () => {
		const layer = await createSingleParquetLayer('https://example.test/invalid-metadata.parquet');

		expect(layer.id).toBe('test-parquet');
		expect(layer.geometryType).toBe('polygon');
		expect(layer.spatialReference).toEqual({ wkid: 4326 });
		expect(layer.geometryEncoding?.toJSON()).toEqual({
			type: 'wkb',
			field: 'Shape'
		});
	});

	it('fails webmap creation when parquet metadata is temporarily unavailable', async () => {
		arcgis.getParquetLayerInfo.mockRejectedValueOnce(new Error('metadata unavailable'));

		await expect(
			createWebMapFromJson({
				operationalLayers: [
					{
						id: 'broken',
						title: 'Broken parquet',
						layerType: 'ParquetLayer',
						url: 'https://example.test/broken.parquet',
						visibility: true
					}
				]
			})
		).rejects.toThrow('metadata unavailable');
		expect(arcgis.getParquetLayerInfo).toHaveBeenCalledTimes(1);
	});

	it('enables an otherwise hidden basemap so the map has visible geography', async () => {
		await createWebMapFromJson({
			baseMap: {
				baseMapLayers: [
					{
						id: 'gb-light-grey',
						layerType: 'VectorTileLayer',
						visibility: false
					}
				]
			},
			operationalLayers: []
		});

		expect(arcgis.FakeWebMap.fromJsonCalls[0]).toEqual({
			baseMap: {
				baseMapLayers: [
					{
						id: 'gb-light-grey',
						layerType: 'VectorTileLayer',
						visibility: true
					}
				]
			},
			operationalLayers: []
		});
	});

	it('uses a WebMercator-compatible view and basemap for parquet webmaps', async () => {
		const webmap = await createWebMapFromJson({
			spatialReference: {
				wkid: 27700,
				latestWkid: 27700
			},
			initialState: {
				viewpoint: {
					targetGeometry: {
						spatialReference: {
							wkid: 27700,
							latestWkid: 27700
						},
						xmin: -394599,
						ymin: 192721,
						xmax: 985623,
						ymax: 1015241
					}
				}
			},
			baseMap: {
				baseMapLayers: [
					{
						id: 'gb-light-grey',
						layerType: 'VectorTileLayer',
						visibility: false,
						styleUrl: 'https://example.test/gb-light-grey/root.json'
					}
				]
			},
			operationalLayers: [
				{
					id: 'test-parquet',
					title: 'Test parquet',
					layerType: 'ParquetLayer',
					url: 'https://example.test/test.parquet'
				}
			]
		});

		expect((webmap as unknown as InstanceType<typeof arcgis.FakeWebMap>).basemap).toBe(
			'gray-vector'
		);
		expect(arcgis.FakeWebMap.fromJsonCalls[0]).toMatchObject({
			baseMap: undefined,
			spatialReference: undefined,
			initialState: {
				viewpoint: {
					targetGeometry: {
						spatialReference: { wkid: 4326 },
						xmin: -11,
						ymin: 49,
						xmax: 3,
						ymax: 61
					}
				}
			},
			operationalLayers: []
		});
	});
});

function createWebmapFixture(): Record<string, unknown> {
	return {
		operationalLayers: [
			{
				id: 'group-a',
				title: 'Group A',
				visibility: false,
				layerType: 'GroupLayer',
				visibilityMode: 'independent',
				layers: [
					{
						id: 0,
						name: 'Air quality 2019',
						defaultVisibility: false,
						minScale: 10,
						maxScale: 20,
						layerType: 'ParquetLayer',
						url: 'https://example.test/air-quality-2019.parquet',
						layerDefinition: {
							drawingInfo: {
								renderer: { type: 'simple' }
							}
						}
					}
				]
			},
			{
				id: 'group-b',
				title: 'Group B',
				layerType: 'GroupLayer',
				layers: [
					{
						id: 0,
						name: 'Air quality 2020',
						layerType: 'ParquetLayer',
						url: 'https://example.test/air-quality-2020.parquet'
					}
				]
			},
			{
				id: 'map-image-layer',
				title: 'Map image layer',
				layerType: 'MapImageLayer',
				sublayers: [
					{
						id: 2
					}
				]
			}
		]
	};
}

async function createSingleParquetLayer(
	url: string
): Promise<InstanceType<typeof arcgis.FakeParquetLayer>> {
	const webmap = await createWebMapFromJson({
		operationalLayers: [
			{
				id: 'test-parquet',
				title: 'Test parquet',
				layerType: 'ParquetLayer',
				url,
				visibility: true
			}
		]
	});

	return Array.from(webmap.layers as Iterable<unknown>)[0] as InstanceType<
		typeof arcgis.FakeParquetLayer
	>;
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

function createParquetLayerInfo(
	_url = 'https://example.test/layer.parquet'
): Record<string, unknown> {
	return {
		fields: [
			{
				name: 'Shape',
				alias: 'Shape',
				type: 'blob'
			},
			{
				name: 'value',
				alias: 'value',
				type: 'double'
			}
		],
		geometryType: 'polygon',
		spatialReference: { wkid: 4326 },
		file: {
			keyValueMetadata: () => undefined
		}
	};
}
