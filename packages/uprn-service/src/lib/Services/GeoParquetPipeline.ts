export {
	GeoParquetPipeline,
	type ArcgisGeometryType,
	type GeoParquetColumnMetadata,
	type GeoParquetLayerOptions,
	type GeoParquetLayerResult,
	type GeoParquetLayerSettings,
	type GeoParquetMetadata,
	type GeoParquetPipelineRuntime,
	type ParquetField,
	type ParquetLayerInfo
} from './GeoparquetPipeline2';

import {
	GeoParquetPipeline,
	type ParquetLayerInfo as PipelineParquetLayerInfo
} from './GeoparquetPipeline2';

/**
 * Compatibility factory for existing imports.
 *
 * Parquet loading is delegated to GeoparquetPipeline2 so there is only one
 * ArcGIS parquet construction path in the app.
 */
export async function createArcgisGeoParquetPipeline(): Promise<GeoParquetPipeline> {
	const [
		{ default: ParquetLayer },
		{ default: ParquetGeometryEncodingWkb },
		{ default: Extent },
		{ getParquetLayerInfo },
		rendererUtils
	] = await Promise.all([
		import('@arcgis/core/layers/ParquetLayer'),
		import('@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js'),
		import('@arcgis/core/geometry/Extent.js'),
		import('@arcgis/core/layers/support/parquetUtils.js'),
		import('@arcgis/core/renderers/support/jsonUtils.js')
	]);

	return new GeoParquetPipeline({
		ParquetLayer,
		ParquetGeometryEncodingWkb,
		Extent,
		getParquetLayerInfo: (urls: string[]) =>
			getParquetLayerInfo(urls) as unknown as Promise<PipelineParquetLayerInfo>,
		rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
	});
}
