import {
	GeoParquetPipeline,
	type GeoParquetLayerOptions,
	type ParquetLayerInfo as PipelineParquetLayerInfo
} from '$lib/services/geo-parquet-pipeline';
import { arcgisImport } from '@dsh/common/arcgis';
import {
	configureParquetLayer,
	markParquetLayer,
	watchParquetLayerVisibility
} from './geo-parquet-layer-hydrator';
import {
	applyParquetCompatibleMapDefaults,
	asArray,
	asOptionalRecord,
	asRecord,
	getBoolean,
	getNumber,
	getString,
	getStringArray,
	getWebMapJsonForArcgis,
	type JsonRecord
} from './web-map-json';
import { getOriginalLayerId, setOriginalLayerId } from './web-map-layer-identity';
import {
	cleanupUprnLayerResources,
	cleanupUprnWebMapLayerResources
} from './web-map-resource-cleanup';

export { cleanupUprnLayerResources, cleanupUprnWebMapLayerResources };

type LayerConstructor = {
	new (properties?: JsonRecord): __esri.Layer;
	fromJSON?: (json: JsonRecord) => __esri.Layer | null;
};
type LayerCreationContext = {
	parquetPipeline: GeoParquetPipeline;
	reactiveUtils?: {
		watch?: (condition: () => boolean, callback: (value: boolean) => void) => IHandle;
	};
	rootLayers?: __esri.Collection<__esri.Layer>;
	rendererFromJson?: (json: JsonRecord) => unknown;
	onLayerHydrated?: (layer: __esri.Layer) => void;
};

export type CreateWebMapOptions = {
	/**
	 * Invoked after a lazily-loaded parquet layer has been hydrated (and possibly
	 * replaced), with the live layer instance. Consumers can use this to re-apply
	 * state that targets the layer, such as custom renderers, since the placeholder
	 * the layer was created as is discarded on hydration.
	 */
	onLayerHydrated?: (layer: __esri.Layer) => void;
};

export async function createWebMapFromJson(
	webmapJson: unknown,
	options?: CreateWebMapOptions
): Promise<__esri.WebMap> {
	const json = asRecord(webmapJson);
	const WebMap =
		await arcgisImport<typeof import('@arcgis/core/WebMap').default>('@arcgis/core/WebMap.js');
	const context = await createLayerCreationContext();
	context.onLayerHydrated = options?.onLayerHydrated;
	const webmap = WebMap.fromJSON({
		...getWebMapJsonForArcgis(json),
		operationalLayers: []
	}) as __esri.WebMap;
	context.rootLayers = webmap.layers;
	applyParquetCompatibleMapDefaults(webmap, json);

	const layersJson = asArray(json.operationalLayers);
	const layers = await createOperationalLayers(layersJson, context);
	layers.forEach((layer) => webmap.layers.add(layer));

	return webmap;
}

export async function createOperationalLayers(
	layersJson: unknown[],
	context?: LayerCreationContext
): Promise<__esri.Layer[]> {
	const layers: __esri.Layer[] = [];
	const resolvedContext = context ?? (await createLayerCreationContext());

	for (const layerJson of layersJson) {
		const layer = await createOperationalLayer(layerJson, resolvedContext);
		if (layer) {
			layers.push(layer);
		}
	}

	return layers;
}

async function createOperationalLayer(
	layerJson: unknown,
	context: LayerCreationContext,
	parentRuntimeId?: string
): Promise<__esri.Layer | null> {
	const json = asRecord(layerJson);
	const runtimeId = getRuntimeLayerId(json, parentRuntimeId);
	const layerType = getString(json.layerType) ?? getString(json.type);

	if (layerType === 'GroupLayer' || layerType === 'group') {
		return await createGroupLayer(json, context, runtimeId);
	}

	if (layerType === 'ParquetLayer' || layerType === 'parquet') {
		return await createParquetLayer(json, context, runtimeId);
	}

	return await createFallbackLayer(json, runtimeId);
}

async function createGroupLayer(
	json: JsonRecord,
	context: LayerCreationContext,
	runtimeId: string | undefined
): Promise<__esri.GroupLayer> {
	const GroupLayer = await arcgisImport<typeof import('@arcgis/core/layers/GroupLayer').default>(
		'@arcgis/core/layers/GroupLayer.js'
	);
	const layers = await createChildLayers(json, context, runtimeId);
	const groupLayer = new GroupLayer({
		id: runtimeId,
		title: getLayerTitle(json),
		visible: getLayerVisibility(json),
		visibilityMode: getString(json.visibilityMode),
		layers
	} as __esri.GroupLayerProperties);

	setOriginalLayerId(groupLayer, json);
	return groupLayer;
}

async function createParquetLayer(
	json: JsonRecord,
	context: LayerCreationContext,
	runtimeId: string | undefined
): Promise<__esri.Layer> {
	const urls = getParquetUrls(json);

	if (urls.length === 0) {
		throw new Error(
			`Parquet layer ${runtimeId ?? getLayerTitle(json) ?? '<unknown>'} is missing a URL.`
		);
	}

	const options = getParquetLayerOptions(json, runtimeId, urls, context);

	if (options.visible === true) {
		const { layer: parquetLayer } = await context.parquetPipeline.createLayer(options);
		configureParquetLayer(parquetLayer as unknown as __esri.ParquetLayer, json);
		return parquetLayer as unknown as __esri.ParquetLayer;
	}

	const placeholderLayer = context.parquetPipeline.createPlaceholderLayer({
		...options,
		visible: false
	}) as __esri.Layer;

	markParquetLayer(placeholderLayer, json);
	watchParquetLayerVisibility(placeholderLayer, options, json, context);
	return placeholderLayer;
}

async function createFallbackLayer(
	json: JsonRecord,
	runtimeId: string | undefined
): Promise<__esri.Layer | null> {
	const layerType = getString(json.layerType) ?? getString(json.type);
	const properties = {
		...json,
		id: runtimeId,
		title: getLayerTitle(json),
		visible: getLayerVisibility(json)
	};

	if (layerType === 'Raster Layer' && !getString(json.url)) {
		console.warn(`Skipping raster layer ${runtimeId} because it does not define a URL.`);
		return null;
	}

	const LayerConstructor = await getFallbackLayerConstructor(layerType);
	if (!LayerConstructor) {
		console.warn(
			`Unsupported webmap layer type ${layerType ?? '<missing>'} for layer ${runtimeId}.`
		);
		return null;
	}

	const layer = LayerConstructor.fromJSON?.(properties) ?? new LayerConstructor(properties);

	setOriginalLayerId(layer, json);
	return layer;
}

async function getFallbackLayerConstructor(
	layerType: string | undefined
): Promise<LayerConstructor | null> {
	switch (layerType) {
		case 'FeatureLayer':
		case 'ArcGISFeatureLayer':
			return (await arcgisImport('@arcgis/core/layers/FeatureLayer.js')) as LayerConstructor;
		case 'MapImageLayer':
		case 'ArcGISMapServiceLayer':
			return (await arcgisImport('@arcgis/core/layers/MapImageLayer.js')) as LayerConstructor;
		case 'TileLayer':
		case 'ArcGISTiledMapServiceLayer':
			return (await arcgisImport('@arcgis/core/layers/TileLayer.js')) as LayerConstructor;
		case 'VectorTileLayer':
			return (await arcgisImport('@arcgis/core/layers/VectorTileLayer.js')) as LayerConstructor;
		case 'ImageryLayer':
		case 'Raster Layer':
			return (await arcgisImport('@arcgis/core/layers/ImageryLayer.js')) as LayerConstructor;
		default:
			return null;
	}
}

async function createChildLayers(
	parentJson: JsonRecord,
	context: LayerCreationContext,
	parentRuntimeId: string | undefined
): Promise<__esri.Layer[]> {
	const children: __esri.Layer[] = [];

	for (const childJson of asArray(parentJson.layers)) {
		const childLayer = await createOperationalLayer(childJson, context, parentRuntimeId);
		if (childLayer) {
			children.push(childLayer);
		}
	}

	return children;
}

function getRuntimeLayerId(json: JsonRecord, parentRuntimeId?: string): string | undefined {
	const sourceId = getLayerSourceId(json);
	if (!sourceId) {
		return undefined;
	}

	if (parentRuntimeId && isNumericLayerId(sourceId)) {
		return `${parentRuntimeId}-${sourceId}`;
	}

	return sourceId;
}

function getLayerSourceId(json: JsonRecord): string | undefined {
	const id = json.id;
	if (typeof id === 'string' || typeof id === 'number') {
		return String(id);
	}

	return undefined;
}

function isNumericLayerId(id: string): boolean {
	return /^\d+$/.test(id);
}

function getLayerTitle(json: JsonRecord): string | undefined {
	return getString(json.title) ?? getString(json.name);
}

function getLayerVisibility(json: JsonRecord): boolean | undefined {
	return (
		getBoolean(json.visibility) ?? getBoolean(json.visible) ?? getBoolean(json.defaultVisibility)
	);
}

function getLayerDefinition(json: JsonRecord): JsonRecord | undefined {
	return asOptionalRecord(json.layerDefinition);
}

function getParquetUrls(json: JsonRecord): string[] {
	const urls = getStringArray(json.urls);
	const url = getString(json.url);

	return urls.length > 0 ? urls : url ? [url] : [];
}

function getParquetLayerOptions(
	json: JsonRecord,
	runtimeId: string | undefined,
	urls: string[],
	context: LayerCreationContext
): GeoParquetLayerOptions {
	const layerDefinition = getLayerDefinition(json);

	return {
		id: runtimeId,
		title: getLayerTitle(json) ?? runtimeId ?? urls[0],
		visible: getLayerVisibility(json),
		minScale: getNumber(json.minScale) ?? getNumber(layerDefinition?.minScale),
		maxScale: getNumber(json.maxScale) ?? getNumber(layerDefinition?.maxScale),
		urls,
		renderer: getRendererJson(json, context)
	};
}

function getRendererJson(json: JsonRecord, context: LayerCreationContext): unknown {
	const layerDefinition = getLayerDefinition(json);
	const drawingInfo =
		asOptionalRecord(layerDefinition?.drawingInfo) ?? asOptionalRecord(json.drawingInfo);
	const renderer = asOptionalRecord(json.renderer) ?? asOptionalRecord(drawingInfo?.renderer);

	if (!renderer) {
		return undefined;
	}

	try {
		const rendererJson = JSON.parse(JSON.stringify(renderer)) as JsonRecord;
		return context.rendererFromJson?.(rendererJson) ?? rendererJson;
	} catch (rendererError) {
		console.warn('Could not apply renderer JSON.', rendererError);
		return renderer;
	}
}

export { getOriginalLayerId };

async function createLayerCreationContext(): Promise<LayerCreationContext> {
	const [
		ParquetLayer,
		GraphicsLayer,
		ParquetGeometryEncodingWkb,
		Extent,
		parquetUtils,
		reactiveUtils,
		rendererUtils
	] = await arcgisImport<
		[
			typeof import('@arcgis/core/layers/ParquetLayer').default,
			typeof import('@arcgis/core/layers/GraphicsLayer').default,
			typeof import('@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js').default,
			typeof import('@arcgis/core/geometry/Extent.js').default,
			typeof import('@arcgis/core/layers/support/parquetUtils.js'),
			typeof import('@arcgis/core/core/reactiveUtils.js'),
			typeof import('@arcgis/core/renderers/support/jsonUtils.js')
		]
	>([
		'@arcgis/core/layers/ParquetLayer.js',
		'@arcgis/core/layers/GraphicsLayer.js',
		'@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js',
		'@arcgis/core/geometry/Extent.js',
		'@arcgis/core/layers/support/parquetUtils.js',
		'@arcgis/core/core/reactiveUtils.js',
		'@arcgis/core/renderers/support/jsonUtils.js'
	]);

	const { getParquetLayerInfo } = parquetUtils;

	return {
		parquetPipeline: new GeoParquetPipeline({
			createParquetLayer: (properties) =>
				new ParquetLayer(properties as __esri.ParquetLayerProperties),
			createPlaceholderLayer: (properties) =>
				new GraphicsLayer(properties as __esri.GraphicsLayerProperties),
			createWkbGeometryEncoding: (properties) =>
				new ParquetGeometryEncodingWkb(properties as __esri.ParquetGeometryEncodingWkbProperties),
			createExtent: (properties) => new Extent(properties as __esri.ExtentProperties),
			getParquetLayerInfo: (urls: string[]) =>
				getParquetLayerInfo(urls) as unknown as Promise<PipelineParquetLayerInfo>,
			rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
		}),
		reactiveUtils,
		rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
	};
}
