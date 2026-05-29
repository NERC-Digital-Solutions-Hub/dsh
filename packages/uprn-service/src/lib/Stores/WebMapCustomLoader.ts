import {
	GeoParquetPipeline,
	type GeoParquetLayerOptions,
	type ParquetLayerInfo as PipelineParquetLayerInfo
} from '$lib/Services/GeoparquetPipeline2';
import { arcgisImport } from '$lib/Utilities/ArcgisLoader';

type JsonRecord = Record<string, unknown>;
type LayerWithOriginalId = __esri.Layer & { readonly __uprnOriginalLayerId?: string };
type UprnParquetLayer = __esri.Layer & {
	readonly __uprnParquetLayer?: boolean;
	readonly __uprnOriginalLayerId?: string;
};
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
		configureParquetLayer(parquetLayer as __esri.ParquetLayer, json);
		return parquetLayer as __esri.ParquetLayer;
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

function applyParquetLayerPresentationOptions(layer: __esri.ParquetLayer, json: JsonRecord): void {
	const opacity = getNumber(json.opacity);
	const popupEnabled = getPopupEnabled(json);
	const popupTemplate = asOptionalRecord(json.popupTemplate) ?? asOptionalRecord(json.popupInfo);
	const labelsVisible = getBoolean(json.labelsVisible);
	const outFields = getStringArray(json.outFields);
	const blendMode = getString(json.blendMode);

	if (opacity !== undefined) {
		layer.opacity = opacity;
	}

	if (popupEnabled !== undefined) {
		layer.popupEnabled = popupEnabled;
	}

	if (popupTemplate) {
		layer.popupTemplate = popupTemplate as unknown as __esri.PopupTemplate;
	}

	if (labelsVisible !== undefined) {
		layer.labelsVisible = labelsVisible;
	}

	if (asArray(json.labelingInfo).length > 0) {
		layer.labelingInfo = asArray(json.labelingInfo) as __esri.LabelClass[];
	}

	if (outFields.length > 0) {
		layer.outFields = outFields;
	}

	if (json.featureReduction) {
		layer.featureReduction = json.featureReduction as __esri.FeatureReductionCluster;
	}

	if (json.effect) {
		layer.effect = json.effect as __esri.Effect;
	}

	if (blendMode) {
		layer.blendMode = blendMode as __esri.BlendLayer['blendMode'];
	}

	if (asArray(json.orderBy).length > 0) {
		layer.orderBy = asArray(json.orderBy) as __esri.OrderByInfo[];
	}
}

function configureParquetLayer(layer: __esri.ParquetLayer, json: JsonRecord): void {
	applyParquetLayerPresentationOptions(layer, json);
	markParquetLayer(layer, json);
}

function markParquetLayer(layer: __esri.Layer, json: JsonRecord): void {
	Object.defineProperty(layer as UprnParquetLayer, '__uprnParquetLayer', {
		value: true,
		enumerable: false,
		configurable: true
	});

	setOriginalLayerId(layer, json);
}

function watchParquetLayerVisibility(
	layer: __esri.Layer,
	options: GeoParquetLayerOptions,
	json: JsonRecord,
	context: LayerCreationContext
): void {
	const hydrateIfVisible = (visible: boolean): void => {
		if (!visible || context.parquetPipeline.getLayerResult(layer)) {
			return;
		}

		void hydrateParquetLayer(layer, options, json, context);
	};

	const handle =
		context.reactiveUtils?.watch?.(() => Boolean(layer.visible), hydrateIfVisible) ??
		(typeof layer.watch === 'function' ? layer.watch('visible', hydrateIfVisible) : undefined);

	if (handle) {
		Object.defineProperty(layer, '__uprnParquetVisibilityHandle', {
			value: handle,
			enumerable: false,
			configurable: true
		});
	}
}

async function hydrateParquetLayer(
	layer: __esri.Layer,
	options: GeoParquetLayerOptions,
	json: JsonRecord,
	context: LayerCreationContext
): Promise<void> {
	const shouldRestoreVisible = Boolean(layer.visible);

	try {
		layer.visible = false;

		if (layer.type === 'parquet') {
			await context.parquetPipeline.hydrateLayer(layer, {
				...options,
				visible: shouldRestoreVisible
			});
			configureParquetLayer(layer as __esri.ParquetLayer, json);
			context.onLayerHydrated?.(layer);
			return;
		}

		const { layer: hydratedLayer } = await context.parquetPipeline.createLayer({
			...options,
			visible: shouldRestoreVisible
		});
		configureParquetLayer(hydratedLayer as __esri.ParquetLayer, json);
		replaceLayer(layer, hydratedLayer as __esri.Layer, context);
		context.onLayerHydrated?.(hydratedLayer as __esri.Layer);
	} catch (error) {
		layer.visible = false;
		console.error(`Failed to prepare GeoParquet layer ${options.title}.`, error);
	}
}

function replaceLayer(
	previousLayer: __esri.Layer,
	nextLayer: __esri.Layer,
	context: LayerCreationContext
): void {
	const collection = getLayerCollection(previousLayer, context);

	if (!collection) {
		context.rootLayers?.add(nextLayer);
		return;
	}

	const layers = collection.toArray?.() ?? [];
	const index = layers.indexOf(previousLayer);

	if (index === -1) {
		collection.add(nextLayer);
		return;
	}

	if (typeof collection.splice === 'function') {
		collection.splice(index, 1, nextLayer);
		return;
	}

	collection.remove(previousLayer);
	collection.add(nextLayer, index);
}

function getLayerCollection(
	layer: __esri.Layer,
	context: LayerCreationContext
): __esri.Collection<__esri.Layer> | undefined {
	const parent = layer.parent as __esri.GroupLayer | undefined;
	return parent?.layers ?? context.rootLayers;
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

function getPopupEnabled(json: JsonRecord): boolean | undefined {
	const popupEnabled = getBoolean(json.popupEnabled);
	if (popupEnabled !== undefined) {
		return popupEnabled;
	}

	const disablePopup = getBoolean(json.disablePopup);
	return disablePopup === undefined ? undefined : !disablePopup;
}

function setOriginalLayerId(layer: __esri.Layer, json: JsonRecord): void {
	const sourceId = getLayerSourceId(json);
	if (!sourceId || sourceId === layer.id) {
		return;
	}

	Object.defineProperty(layer as LayerWithOriginalId, '__uprnOriginalLayerId', {
		value: sourceId,
		enumerable: false,
		configurable: true
	});
}

function asRecord(value: unknown): JsonRecord {
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		return value as JsonRecord;
	}

	throw new Error('Webmap JSON must be an object.');
}

function asOptionalRecord(value: unknown): JsonRecord | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as JsonRecord)
		: undefined;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function getString(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
	return typeof value === 'number' ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
	return typeof value === 'boolean' ? value : undefined;
}

function getStringArray(value: unknown): string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

export function getOriginalLayerId(layer: __esri.Layer): string | undefined {
	return (layer as LayerWithOriginalId).__uprnOriginalLayerId;
}

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
			ParquetLayer,
			PlaceholderLayer: GraphicsLayer,
			ParquetGeometryEncodingWkb,
			Extent,
			getParquetLayerInfo: (urls: string[]) =>
				getParquetLayerInfo(urls) as unknown as Promise<PipelineParquetLayerInfo>,
			rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
		}),
		reactiveUtils,
		rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
	};
}

function getWebMapJsonForArcgis(json: JsonRecord): JsonRecord {
	if (hasParquetLayers(json)) {
		return getParquetCompatibleWebMapJson(json);
	}

	return {
		...json,
		baseMap: getBaseMapJsonForArcgis(asOptionalRecord(json.baseMap))
	};
}

function getParquetCompatibleWebMapJson(json: JsonRecord): JsonRecord {
	const nextJson = {
		...json,
		baseMap: undefined,
		initialState: getParquetCompatibleInitialState(asOptionalRecord(json.initialState)),
		spatialReference: undefined
	};

	return nextJson;
}

function applyParquetCompatibleMapDefaults(webmap: __esri.WebMap, json: JsonRecord): void {
	if (!hasParquetLayers(json)) {
		return;
	}

	webmap.basemap = 'gray-vector';
}

function getParquetCompatibleInitialState(initialState: JsonRecord | undefined): JsonRecord {
	return {
		...initialState,
		viewpoint: {
			targetGeometry: {
				spatialReference: { wkid: 4326 },
				xmin: -11,
				ymin: 49,
				xmax: 3,
				ymax: 61
			}
		}
	};
}

function hasParquetLayers(json: JsonRecord): boolean {
	return asArray(json.operationalLayers).some(hasParquetLayer);
}

function hasParquetLayer(layerJson: unknown): boolean {
	const json = asOptionalRecord(layerJson);
	if (!json) {
		return false;
	}

	const layerType = getString(json.layerType) ?? getString(json.type);
	if (layerType === 'ParquetLayer' || layerType === 'parquet') {
		return true;
	}

	return asArray(json.layers).some(hasParquetLayer);
}

function getBaseMapJsonForArcgis(baseMap: JsonRecord | undefined): JsonRecord | undefined {
	if (!baseMap) {
		return undefined;
	}

	const baseMapLayers = asArray(baseMap.baseMapLayers);
	if (baseMapLayers.length === 0) {
		return baseMap;
	}

	const hasVisibleBaseMapLayer = baseMapLayers.some(
		(layerJson) => getLayerVisibility(asRecord(layerJson)) !== false
	);

	if (hasVisibleBaseMapLayer) {
		return baseMap;
	}

	return {
		...baseMap,
		baseMapLayers: baseMapLayers.map((layerJson) => ({
			...asRecord(layerJson),
			visibility: true
		}))
	};
}
