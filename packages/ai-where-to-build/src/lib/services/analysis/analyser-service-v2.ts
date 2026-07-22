import { getAiWhereToBuildConfig } from '$lib/services/ai-where-to-build-config-provider';
import {
	EnumFieldLayerAnalysisSettings,
	FieldLayerAnalysisSettings,
	NumericFieldLayerAnalysisSettings,
	WeightedLayerAnalysisSettings,
	type LayerAnalysisSettings,
	type LayerBufferZone
} from '$lib/models/layer-analysis-settings';
import type { AiWhereToBuildConfig } from '$lib/types/ai-where-to-build';
import { clipPoints } from '$lib/tools/map/clip-points';
import { clipPolygon } from '$lib/tools/map/clip-polygon';
import { createPolygonBuffer } from '$lib/tools/map/create-polygon-buffer';
import { mergeClippedPolygons } from '$lib/tools/map/merge-clipped-polygons';
import { getUnionPolygonGeometryByIds } from '$lib/tools/map/utils';
import { arcgisImport } from '@dsh/common/arcgis';
import {
	createAnalysisRunId,
	createFillSymbol,
	createPopupTemplate,
	flattenLayers,
	goToGraphics,
	getParcelsLayer,
	prepareAnalysisRun,
	tagAnalysisGraphics,
	type AnalyserServiceContext
} from './analysis-service-shared';

export class AnalyserServiceV2 {
	#lastAnalyzedPolygonsKey: string | null = null;
	#mapView: __esri.MapView;
	#graphicLayer: __esri.GraphicsLayer;

	constructor({ mapView, graphicLayer }: AnalyserServiceContext) {
		this.#mapView = mapView;
		this.#graphicLayer = graphicLayer;
	}

	public async analyse(selectedObjectIds: number[]): Promise<boolean> {
		if (selectedObjectIds.length === 0) {
			console.warn('[analysis-tab] No area selected for profile');
			return false;
		}

		const analysisKey = `profiled-${selectedObjectIds.join('-')}`;
		if (this.#lastAnalyzedPolygonsKey === analysisKey) {
			console.log('[analysis-tab] Profile already performed for the selected area(s)');
			return false;
		}

		const parcelsLayer = getParcelsLayer(this.#mapView);
		if (!parcelsLayer) {
			console.warn('[analysis-tab] Parcels layer not found');
			return false;
		}

		const parcelPolygon = await getUnionPolygonGeometryByIds(
			parcelsLayer,
			selectedObjectIds,
			'OBJECTID',
			this.#mapView
		);

		if (!parcelPolygon) {
			console.warn('[analysis-tab] Unable to retrieve polygon for selected parcel IDs');
			return false;
		}

		const analysisRunId = createAnalysisRunId('analysis-v2', selectedObjectIds);
		prepareAnalysisRun(this.#graphicLayer);

		const config: AiWhereToBuildConfig = await getAiWhereToBuildConfig();

		const allLayers = flattenLayers(this.#mapView.map!.layers.toArray());
		for (const layerSetting of config.analysisSettings as LayerAnalysisSettings[]) {
			const layer = allLayers.find(
				(layer) =>
					layer.type === 'feature' &&
					(layer as __esri.FeatureLayer).portalItem?.id === layerSetting.id
			) as __esri.FeatureLayer | undefined;

			if (!layer) {
				console.log(`Layer for setting ID ${layerSetting.id} not found on the map`);
				continue;
			}

			if (layer.id === parcelsLayer.id) {
				console.log(`Skipping parcels layer itself: ${layer.title}`);
				continue;
			}

			try {
				if (layer.geometryType === 'polygon') {
					await this.#processPolygonFeatureLayer(parcelPolygon, layer, layerSetting, analysisRunId);
				} else if (layer.geometryType === 'point' || layer.geometryType === 'multipoint') {
					await this.#processPointFeatureLayer(parcelPolygon, layer, layerSetting, analysisRunId);
				}
			} catch (error) {
				console.error(`Error processing layer ${layer.title}:`, error);
				continue;
			}
		}

		await this.#addBaseWeightPolygon(parcelPolygon, analysisRunId);
		const mergedPolygons = await mergeClippedPolygons(this.#graphicLayer, { analysisRunId });
		this.#calculateTotalWeight(mergedPolygons);
		this.#styleMergedPolygonsWithWeights(mergedPolygons);
		goToGraphics(this.#mapView, mergedPolygons);

		this.#lastAnalyzedPolygonsKey = analysisKey;
		return true;
	}

	async #processPolygonFeatureLayer(
		inputPolygon: __esri.Polygon,
		clipLayer: __esri.FeatureLayer,
		clipLayerSettings: LayerAnalysisSettings,
		analysisRunId: string
	): Promise<void> {
		const polygons = await clipPolygon({
			view: this.#mapView,
			input: inputPolygon,
			clipLayer,
			clipLayerValueField:
				clipLayerSettings instanceof FieldLayerAnalysisSettings
					? clipLayerSettings.fieldName
					: undefined,
			targetLayer: this.#graphicLayer,
			zoomToResult: false
		});

		if (!polygons || polygons.length === 0) {
			console.log(`No polygon clipped for layer: ${clipLayer.title}`);
			return;
		}

		tagAnalysisGraphics(polygons, analysisRunId);

		const layerWeight =
			clipLayerSettings instanceof WeightedLayerAnalysisSettings ||
			clipLayerSettings instanceof NumericFieldLayerAnalysisSettings
				? clipLayerSettings.weight
				: undefined;

		for (const polygon of polygons) {
			polygon.attributes ??= {};
			polygon.attributes.layerTitle = clipLayer.title;
			polygon.attributes.layerId = clipLayer.id;
			polygon.attributes.weight = layerWeight;

			polygon.attributes.layerTitles = [clipLayer.title];
			polygon.symbol = createFillSymbol(clipLayer.id, 0.3, [255, 0, 0, 1], 2);

			const value = polygon.attributes.value;
			polygon.attributes.weight = !layerWeight
				? this.#getFieldValueWeight(value, clipLayerSettings)
				: layerWeight;

			const bufferZones =
				clipLayerSettings instanceof WeightedLayerAnalysisSettings
					? clipLayerSettings.buffers
					: this.#getFieldValueBufferZones(value, clipLayerSettings);

			for (const bufferZone of bufferZones) {
				if (bufferZone.distance > 0) {
					const bufferPolygon = await createPolygonBuffer({
						view: this.#mapView,
						input: polygon,
						targetLayer: this.#graphicLayer,
						bufferDistance: bufferZone.distance,
						bufferUnit: bufferZone.unit,
						zoomToResult: false
					});

					if (bufferPolygon) {
						bufferPolygon.attributes = {
							...polygon.attributes,
							analysisRunId,
							polygonBuffer: true,
							bufferDistance: bufferZone.distance,
							bufferUnit: bufferZone.unit,
							weight: bufferZone.weight
						};

						bufferPolygon.symbol = createFillSymbol(
							`${clipLayer.id}-buffer-${bufferZone.distance}-${bufferZone.unit}`,
							0.2,
							[0, 0, 255, 1],
							1
						);
					}
				}
			}
		}
	}

	#getFieldValueWeight(
		value: string | number,
		layerSettings: LayerAnalysisSettings
	): number | undefined {
		if (!(layerSettings instanceof EnumFieldLayerAnalysisSettings)) {
			return undefined;
		}

		const fieldValueSetting = layerSettings.fieldValues.find((fv) => fv.value === value);
		if (!fieldValueSetting) {
			return undefined;
		}

		return fieldValueSetting.weight;
	}

	#getFieldValueBufferZones(
		value: string | number,
		layerSettings: LayerAnalysisSettings
	): LayerBufferZone[] {
		if (!(layerSettings instanceof EnumFieldLayerAnalysisSettings)) {
			return [];
		}

		const fieldValueSetting = layerSettings.fieldValues.find((fv) => fv.value === value);
		if (!fieldValueSetting) {
			return [];
		}

		return fieldValueSetting.buffers || [];
	}

	#getDefaultPointLayerBufferZone(layerSettings: LayerAnalysisSettings): LayerBufferZone | null {
		if (layerSettings instanceof WeightedLayerAnalysisSettings) {
			return layerSettings.buffers?.[0] ?? null;
		}

		if (layerSettings instanceof EnumFieldLayerAnalysisSettings) {
			const withBuffer = layerSettings.fieldValues.find((fv) => fv.buffers && fv.buffers.length);
			return withBuffer?.buffers?.[0] ?? null;
		}

		return null;
	}

	async #processPointFeatureLayer(
		inputPolygon: __esri.Polygon,
		clipLayer: __esri.FeatureLayer,
		layerSettings: LayerAnalysisSettings,
		analysisRunId: string
	): Promise<void> {
		const valueField =
			layerSettings instanceof FieldLayerAnalysisSettings ? layerSettings.fieldName : undefined;
		const baseBufferZone = this.#getDefaultPointLayerBufferZone(layerSettings);
		const bufferDistance = baseBufferZone?.distance ?? 1;
		const bufferUnit = baseBufferZone?.unit;

		const polygons = await clipPoints({
			view: this.#mapView,
			input: inputPolygon,
			clipLayer,
			clipLayerValueField: valueField,
			bufferDistance,
			bufferUnit,
			targetLayer: this.#graphicLayer,
			zoomToResult: false
		});

		if (!polygons || polygons.length === 0) {
			console.log(`No polygon clipped for layer: ${clipLayer.title}`);
			return;
		}

		tagAnalysisGraphics(polygons, analysisRunId);

		for (const polygon of polygons) {
			polygon.attributes ??= {};
			const value = polygon.attributes.value;
			polygon.attributes.layerTitle = clipLayer.title;
			polygon.attributes.layerId = clipLayer.id;
			polygon.attributes.layerTitles = [clipLayer.title];
			polygon.attributes.layerValues =
				value != null ? [String(value)] : (polygon.attributes.layerValues ?? []);
			polygon.attributes.weight =
				layerSettings instanceof WeightedLayerAnalysisSettings
					? layerSettings.weight
					: this.#getFieldValueWeight(value, layerSettings);
			polygon.symbol = createFillSymbol(clipLayer.id, 0.3, [255, 0, 0, 1], 2);

			const bufferZones =
				layerSettings instanceof WeightedLayerAnalysisSettings
					? layerSettings.buffers
					: this.#getFieldValueBufferZones(value, layerSettings);

			for (const bufferZone of bufferZones) {
				const { distance, unit } = bufferZone;
				if (!distance || distance <= 0) {
					continue;
				}
				if (
					baseBufferZone &&
					baseBufferZone.distance === distance &&
					baseBufferZone.unit === unit
				) {
					continue;
				}

				const bufferPolygon = await createPolygonBuffer({
					view: this.#mapView,
					input: polygon,
					targetLayer: this.#graphicLayer,
					bufferDistance: distance,
					bufferUnit: unit,
					zoomToResult: false
				});

				if (bufferPolygon) {
					bufferPolygon.attributes = {
						...polygon.attributes,
						analysisRunId,
						polygonBuffer: true,
						bufferDistance: distance,
						bufferUnit: unit,
						weight: bufferZone.weight
					};

					bufferPolygon.symbol = createFillSymbol(
						`${clipLayer.id}-buffer-${distance}-${unit ?? 'sr'}`,
						0.2,
						[0, 0, 255, 1],
						1
					);
				}
			}
		}
	}

	async #addBaseWeightPolygon(polygon: __esri.Polygon, analysisRunId: string): Promise<void> {
		const Graphic =
			await arcgisImport<typeof import('@arcgis/core/Graphic.js').default>(
				'@arcgis/core/Graphic.js'
			);
		const baseWeightPolygon = new Graphic({
			geometry: polygon.clone(),
			attributes: {
				analysisRunId,
				layerTitle: 'Base Weight',
				layerId: 'base-weight-layer',
				layerTitles: ['Base Weight'],
				layerValues: ['base'],
				value: 'base',
				weight: 0,
				clipped: false,
				baseWeight: true
			},
			symbol: {
				type: 'simple-fill' as const,
				color: [128, 128, 128, 0.1],
				outline: {
					color: [128, 128, 128, 0.5],
					width: 1
				}
			}
		});
		this.#graphicLayer.add(baseWeightPolygon);
	}

	#calculateTotalWeight(polygons: __esri.Graphic[]) {
		for (const polygon of polygons) {
			const titles: string[] = polygon.attributes.memberLayerTitles ?? [];
			const weights: number[] = polygon.attributes.memberLayerWeights ?? [];

			const weightMap = new Map<string, number>();

			for (let i = 0; i < titles.length; i++) {
				const title = titles[i];
				const weight = weights[i];

				if (weight == null || isNaN(weight as number)) continue;

				const current = weightMap.get(title) ?? Number.POSITIVE_INFINITY;
				if (weight < current) {
					weightMap.set(title, weight);
				}
			}

			const totalWeight = Array.from(weightMap.values()).reduce((sum, weight) => sum + weight, 0);
			if (weightMap.values().find((value) => value <= -1)) {
				polygon.attributes.totalWeight = -1;
				continue;
			}

			polygon.attributes.totalWeight = totalWeight;
		}
	}

	#styleMergedPolygonsWithWeights(mergedPolygons: __esri.Graphic[]): void {
		for (const graphic of mergedPolygons) {
			const totalWeight =
				typeof graphic.attributes.totalWeight === 'number' ? graphic.attributes.totalWeight : 0;

			const clampedWeight = Math.max(-1, Math.min(1, totalWeight));

			let fillColor: number[];
			if (clampedWeight <= 0) {
				const t = clampedWeight + 1;
				fillColor = [Math.round(255 * t), 0, 0, 0.5];
			} else {
				const t = clampedWeight;
				fillColor = [Math.round(255 * (1 - t)), Math.round(255 * t), 0, 0.5];
			}

			graphic.symbol = {
				type: 'simple-fill' as const,
				color: fillColor,
				outline: {
					color: [0, 0, 0, 1],
					width: 1
				}
			};
			graphic.popupTemplate = createPopupTemplate();
		}
	}
}
