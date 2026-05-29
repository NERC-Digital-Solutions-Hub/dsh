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
import { arcgisImport } from '$lib/Utilities/ArcgisLoader';

/**
 * Compatibility factory for existing imports.
 *
 * Parquet loading is delegated to GeoparquetPipeline2 so there is only one
 * ArcGIS parquet construction path in the app.
 */
export async function createArcgisGeoParquetPipeline(): Promise<GeoParquetPipeline> {
	const [ParquetLayer, ParquetGeometryEncodingWkb, Extent, parquetUtils, rendererUtils] =
		await arcgisImport<
			[
				typeof import('@arcgis/core/layers/ParquetLayer').default,
				typeof import('@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js').default,
				typeof import('@arcgis/core/geometry/Extent.js').default,
				typeof import('@arcgis/core/layers/support/parquetUtils.js'),
				typeof import('@arcgis/core/renderers/support/jsonUtils.js')
			]
		>([
			'@arcgis/core/layers/ParquetLayer.js',
			'@arcgis/core/layers/support/ParquetGeometryEncodingWkb.js',
			'@arcgis/core/geometry/Extent.js',
			'@arcgis/core/layers/support/parquetUtils.js',
			'@arcgis/core/renderers/support/jsonUtils.js'
		]);

	const { getParquetLayerInfo } = parquetUtils;

	return new GeoParquetPipeline({
		ParquetLayer,
		ParquetGeometryEncodingWkb,
		Extent,
		getParquetLayerInfo: (urls: string[]) =>
			getParquetLayerInfo(urls) as unknown as Promise<PipelineParquetLayerInfo>,
		rendererFromJson: (renderer) => rendererUtils.fromJSON(renderer)
	});
}
