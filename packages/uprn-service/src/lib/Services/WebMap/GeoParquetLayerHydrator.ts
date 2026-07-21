import type { GeoParquetLayerOptions, GeoParquetPipeline } from '$lib/Services/GeoParquetPipeline';
import {
	asArray,
	asOptionalRecord,
	getBoolean,
	getNumber,
	getString,
	getStringArray,
	type JsonRecord
} from './WebMapJson';
import { setOriginalLayerId } from './WebMapLayerIdentity';
import { removeParquetVisibilityHandle } from './WebMapResourceCleanup';

type UprnParquetLayer = __esri.Layer & {
	readonly __uprnParquetLayer?: boolean;
	__uprnParquetVisibilityHandle?: IHandle;
};

export type ParquetHydrationContext = {
	parquetPipeline: GeoParquetPipeline;
	reactiveUtils?: {
		watch?: (condition: () => boolean, callback: (value: boolean) => void) => IHandle;
	};
	rootLayers?: __esri.Collection<__esri.Layer>;
	onLayerHydrated?: (layer: __esri.Layer) => void;
};

export function configureParquetLayer(layer: __esri.ParquetLayer, json: JsonRecord): void {
	applyPresentationOptions(layer, json);
	markParquetLayer(layer, json);
}

export function markParquetLayer(layer: __esri.Layer, json: JsonRecord): void {
	Object.defineProperty(layer as UprnParquetLayer, '__uprnParquetLayer', {
		value: true,
		enumerable: false,
		configurable: true
	});
	setOriginalLayerId(layer, json);
}

export function watchParquetLayerVisibility(
	layer: __esri.Layer,
	options: GeoParquetLayerOptions,
	json: JsonRecord,
	context: ParquetHydrationContext
): void {
	const hydrateIfVisible = (visible: boolean): void => {
		if (!visible || context.parquetPipeline.getLayerResult(layer)) return;
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
	context: ParquetHydrationContext
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
		configureParquetLayer(hydratedLayer as unknown as __esri.ParquetLayer, json);
		replaceLayer(layer, hydratedLayer as unknown as __esri.Layer, context);
		context.onLayerHydrated?.(hydratedLayer as unknown as __esri.Layer);
	} catch (error) {
		layer.visible = false;
		console.error(`Failed to prepare GeoParquet layer ${options.title}.`, error);
	}
}

function replaceLayer(
	previousLayer: __esri.Layer,
	nextLayer: __esri.Layer,
	context: ParquetHydrationContext
): void {
	removeParquetVisibilityHandle(previousLayer);
	const parent = previousLayer.parent as __esri.GroupLayer | undefined;
	const collection = parent?.layers ?? context.rootLayers;
	if (!collection) {
		context.rootLayers?.add(nextLayer);
		return;
	}
	const index = (collection.toArray?.() ?? []).indexOf(previousLayer);
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

function applyPresentationOptions(layer: __esri.ParquetLayer, json: JsonRecord): void {
	const opacity = getNumber(json.opacity);
	const popupEnabled = getPopupEnabled(json);
	const popupTemplate = asOptionalRecord(json.popupTemplate) ?? asOptionalRecord(json.popupInfo);
	const labelsVisible = getBoolean(json.labelsVisible);
	const outFields = getStringArray(json.outFields);
	const blendMode = getString(json.blendMode);
	if (opacity !== undefined) layer.opacity = opacity;
	if (popupEnabled !== undefined) layer.popupEnabled = popupEnabled;
	if (popupTemplate) layer.popupTemplate = popupTemplate as unknown as __esri.PopupTemplate;
	if (labelsVisible !== undefined) layer.labelsVisible = labelsVisible;
	if (asArray(json.labelingInfo).length > 0) {
		layer.labelingInfo = asArray(json.labelingInfo) as __esri.LabelClass[];
	}
	if (outFields.length > 0) layer.outFields = outFields;
	if (json.featureReduction) {
		layer.featureReduction = json.featureReduction as __esri.FeatureReductionCluster;
	}
	if (json.effect) layer.effect = json.effect as __esri.Effect;
	if (blendMode) layer.blendMode = blendMode as __esri.BlendLayer['blendMode'];
	if (asArray(json.orderBy).length > 0) {
		layer.orderBy = asArray(json.orderBy) as __esri.OrderByInfo[];
	}
}

function getPopupEnabled(json: JsonRecord): boolean | undefined {
	const popupEnabled = getBoolean(json.popupEnabled);
	if (popupEnabled !== undefined) return popupEnabled;
	const disablePopup = getBoolean(json.disablePopup);
	return disablePopup === undefined ? undefined : !disablePopup;
}
