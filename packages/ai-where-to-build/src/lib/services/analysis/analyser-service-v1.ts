import { clipPolygon } from '$lib/tools/map/clip-polygon';
import { mergeClippedPolygons } from '$lib/tools/map/merge-clipped-polygons';
import { queryPolygonFieldValue } from '$lib/tools/map/query-polygon-field-value';
import { getUnionPolygonGeometryByIds } from '$lib/tools/map/utils';
import { arcgisImport } from '@dsh/common/arcgis';
import {
	createAnalysisRunId,
	createFillSymbol,
	flattenLayers,
	goToGraphics,
	getParcelsLayer,
	prepareAnalysisRun,
	styleMergedPolygons,
	tagAnalysisGraphics,
	type AnalyserServiceContext
} from './analysis-service-shared';

export class AnalyserServiceV1 {
	#lastAnalyzedPolygonsKey: string | null = null;
	#mapView: __esri.MapView;
	#graphicLayer: __esri.GraphicsLayer;

	constructor({ mapView, graphicLayer }: AnalyserServiceContext) {
		this.#mapView = mapView;
		this.#graphicLayer = graphicLayer;
	}

	public async analyse(selectedObjectIds: number[]): Promise<boolean> {
		if (selectedObjectIds.length === 0) {
			console.warn('[analysis-tab] No area selected for analysis');
			return false;
		}

		const analysisKey = `analyzed-${selectedObjectIds.join('-')}`;
		if (this.#lastAnalyzedPolygonsKey === analysisKey) {
			console.log('[analysis-tab] Analysis already performed for the selected area(s)');
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

		const analysisRunId = createAnalysisRunId('analysis-v1', selectedObjectIds);
		prepareAnalysisRun(this.#graphicLayer);

		const allLayers = flattenLayers(this.#mapView.map!.layers.toArray());

		for (const layer of allLayers) {
			if (layer.type !== 'feature') {
				console.log(`Skipping non-feature layer: ${layer.title}, type: ${layer.type}`);
				continue;
			}
			const featureLayer = layer as __esri.FeatureLayer;

			if (featureLayer.id === parcelsLayer.id) {
				console.log(`Skipping parcels layer itself: ${featureLayer.title}`);
				continue;
			}

			if (featureLayer.geometryType !== 'polygon') {
				console.log(
					`Skipping non-polygon layer: ${featureLayer.title}, geometry type: ${featureLayer.geometryType}`
				);
				continue;
			}

			try {
				await this.#processFeatureLayer(featureLayer, parcelPolygon, analysisRunId);
			} catch (error) {
				console.error(`Error processing layer ${featureLayer.title}:`, error);
				continue;
			}
		}

		const mergedPolygons = await mergeClippedPolygons(this.#graphicLayer, { analysisRunId });
		styleMergedPolygons(mergedPolygons);
		goToGraphics(this.#mapView, mergedPolygons);

		this.#lastAnalyzedPolygonsKey = analysisKey;
		return true;
	}

	async #processFeatureLayer(
		layer: __esri.FeatureLayer,
		inputPolygon: __esri.Polygon,
		analysisRunId: string
	): Promise<void> {
		const polygons = await clipPolygon({
			view: this.#mapView,
			input: inputPolygon,
			clipLayer: layer,
			targetLayer: this.#graphicLayer,
			zoomToResult: false
		});

		if (!polygons) {
			console.log(`No polygon clipped for layer: ${layer.title}`);
			return;
		}

		tagAnalysisGraphics(polygons, analysisRunId);

		const Graphic =
			await arcgisImport<typeof import('@arcgis/core/Graphic.js').default>(
				'@arcgis/core/Graphic.js'
			);
		const displayValue = layer.displayField
			? await queryPolygonFieldValue(
					layer,
					new Graphic({ geometry: inputPolygon }),
					layer.displayField
				)
			: undefined;

		for (const polygon of polygons) {
			polygon.attributes ??= {};
			polygon.attributes.layerTitle = layer.title;
			polygon.attributes.layerId = layer.id;

			if (displayValue != null) {
				polygon.attributes.value = displayValue;
				polygon.attributes.layerValues = Array.isArray(displayValue)
					? displayValue
					: [String(displayValue)];
			}

			polygon.attributes.layerTitles = [layer.title];
			polygon.symbol = createFillSymbol(layer.id, 0.3, [255, 0, 0, 1], 2);
		}
	}
}
