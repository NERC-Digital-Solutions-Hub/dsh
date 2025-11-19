// clipPolygon.ts

import * as intersectionOperator from '@arcgis/core/geometry/operators/intersectionOperator.js';
import * as unionOperator from '@arcgis/core/geometry/operators/unionOperator.js';
import Graphic from '@arcgis/core/Graphic.js';

import type FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import type MapView from '@arcgis/core/views/MapView.js';
import type Extent from '@arcgis/core/geometry/Extent.js';
import type Polygon from '@arcgis/core/geometry/Polygon.js';
import type { GeometryUnion } from '@arcgis/core/unionTypes.js';

type InputLayer = FeatureLayer | GraphicsLayer;
type ClipLayer = FeatureLayer | GraphicsLayer;

interface ClipPolygonOptions {
	view?: MapView;
	inputLayer: InputLayer;
	polygonId: number | string;
	idField?: string;
	clipLayer: ClipLayer;
	targetLayer: GraphicsLayer;
	symbol?: __esri.SimpleFillSymbolProperties;
}

/**
 * Intersects a polygon feature/graphic with all intersecting clip geometries
 * from clipLayer, unions the intersection pieces, and adds the final clipped
 * polygon to targetLayer.
 *
 * @param options - Configuration options for clipping
 * @param options.view - MapView for auto-adding target layer and zooming to result
 * @param options.inputLayer - Layer containing the polygon to be clipped
 * @param options.polygonId - ID of the polygon inside inputLayer
 * @param options.idField - Field name holding polygonId (defaults to objectIdField or "id")
 * @param options.clipLayer - Layer providing clip geometries
 * @param options.targetLayer - GraphicsLayer where clipped polygon will be added
 * @param options.symbol - Optional symbol override for the clipped polygon
 * @returns The new clipped Graphic or null if there is no intersection
 */
export async function clipPolygon(options: ClipPolygonOptions): Promise<Graphic | null> {
	const { view, inputLayer, polygonId, clipLayer, targetLayer, idField, symbol } = options;

	const polygon = await getPolygonGeometryById(inputLayer, polygonId, idField, view);
	if (!polygon) {
		console.warn('clipPolygon: polygon not found for id:', polygonId);
		return null;
	}
	if (polygon.type !== 'polygon') {
		console.warn('clipPolygon: input geometry is not a polygon.');
		return null;
	}

	const unionClipGeometry = await getUnionClipGeometryFromLayer(clipLayer, polygon, view);
	if (!unionClipGeometry) {
		console.info('clipPolygon: no geometries in clipLayer intersect the polygon.');
		return null;
	}

	if (!validateSpatialReferences(polygon, unionClipGeometry)) {
		return null;
	}

	const clippedGraphic = createClippedGraphic(unionClipGeometry, polygonId, symbol);

	addGraphicToLayer(targetLayer, clippedGraphic, view);

	if (view) {
		view.goTo(unionClipGeometry).catch((err) => console.warn('goTo failed:', err));
	}

	return clippedGraphic;
}

/* -------------------------------------------------------------------------- */
/*                               Helper methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Validate that two geometries have matching spatial references.
 *
 * @param polygon - First polygon to check
 * @param unionClipGeometry - Second polygon to check
 * @returns True if spatial references match, false otherwise
 */
function validateSpatialReferences(polygon: Polygon, unionClipGeometry: Polygon): boolean {
	if (
		polygon.spatialReference?.wkid !== unionClipGeometry.spatialReference?.wkid &&
		polygon.spatialReference?.wkt !== unionClipGeometry.spatialReference?.wkt
	) {
		console.error(
			'clipPolygon: polygon and union clip geometry must be in the same spatial reference.'
		);
		console.log('polygon SR', polygon.spatialReference?.toJSON());
		console.log('unionClipGeometry SR', unionClipGeometry.spatialReference?.toJSON());
		return false;
	}
	return true;
}

/**
 * Create a graphic for the clipped polygon with attributes and symbol.
 *
 * @param geometry - The clipped polygon geometry
 * @param sourceId - The source polygon ID
 * @param symbol - Optional custom symbol
 * @returns New Graphic representing the clipped polygon
 */
function createClippedGraphic(
	geometry: Polygon,
	sourceId: number | string,
	symbol?: __esri.SimpleFillSymbolProperties
): Graphic {
	return new Graphic({
		geometry,
		attributes: {
			sourceId,
			clipped: true
		},
		symbol: (symbol || {
			type: 'simple-fill',
			color: [0, 0, 0, 0.2],
			outline: {
				color: [255, 0, 0, 1],
				width: 1.5
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}) as any
	});
}

/**
 * Add a graphic to the target layer and ensure the layer is on the map.
 *
 * @param targetLayer - The layer to add the graphic to
 * @param graphic - The graphic to add
 * @param view - Optional MapView to add the layer to if not present
 */
function addGraphicToLayer(targetLayer: GraphicsLayer, graphic: Graphic, view?: MapView): void {
	if (view?.map && !view.map.layers.includes(targetLayer)) {
		view.map.add(targetLayer);
	}
	targetLayer.add(graphic);
}

/**
 * Get polygon geometry by ID from a FeatureLayer or GraphicsLayer.
 *
 * @param layer - The input layer to query
 * @param polygonId - ID of the polygon to retrieve
 * @param explicitIdField - Optional field name for the ID
 * @param view - Optional MapView for spatial reference
 * @returns The polygon geometry or null if not found
 */
async function getPolygonGeometryById(
	layer: InputLayer,
	polygonId: number | string,
	explicitIdField: string | undefined,
	view?: MapView
): Promise<Polygon | null> {
	if (layer.type === 'feature') {
		return getPolygonFromFeatureLayer(layer as FeatureLayer, polygonId, explicitIdField, view);
	}

	if (layer.type === 'graphics') {
		return getPolygonFromGraphicsLayer(layer as GraphicsLayer, polygonId, explicitIdField);
	}

	console.warn(
		'getPolygonGeometryById: unsupported layer type:',
		(layer as unknown as { type: string }).type
	);
	return null;
}

/**
 * Get polygon geometry from a FeatureLayer by ID.
 *
 * @param layer - The FeatureLayer to query
 * @param polygonId - ID of the polygon to retrieve
 * @param explicitIdField - Optional field name for the ID
 * @param view - Optional MapView for spatial reference
 * @returns The polygon geometry or null if not found
 */
async function getPolygonFromFeatureLayer(
	layer: FeatureLayer,
	polygonId: number | string,
	explicitIdField: string | undefined,
	view?: MapView
): Promise<Polygon | null> {
	const fieldName = explicitIdField || layer.objectIdField || 'OBJECTID';

	const q = layer.createQuery();
	q.where = buildWhereClause(fieldName, polygonId);
	q.returnGeometry = true;
	q.outFields = ['*'];
	q.num = 1;

	if (view?.spatialReference) {
		q.outSpatialReference = view.spatialReference;
	}

	const result = await layer.queryFeatures(q);
	const feature = result.features[0];
	const geom = feature?.geometry;
	return geom && geom.type === 'polygon' ? (geom as Polygon) : null;
}

/**
 * Get polygon geometry from a GraphicsLayer by ID.
 *
 * @param layer - The GraphicsLayer to search
 * @param polygonId - ID of the polygon to retrieve
 * @param explicitIdField - Optional field name for the ID
 * @returns The polygon geometry or null if not found
 */
function getPolygonFromGraphicsLayer(
	layer: GraphicsLayer,
	polygonId: number | string,
	explicitIdField: string | undefined
): Polygon | null {
	const fieldName = explicitIdField || 'id';

	const graphic = layer.graphics.find((g) => {
		const attrs = g.attributes || {};
		const val = attrs[fieldName];
		return val === polygonId || String(val) === String(polygonId);
	});

	const geom = graphic?.geometry;
	return geom && geom.type === 'polygon' ? (geom as Polygon) : null;
}

/**
 * Build a WHERE clause for querying by ID.
 *
 * @param fieldName - The field name to query
 * @param polygonId - The ID value to match
 * @returns SQL WHERE clause string
 */
function buildWhereClause(fieldName: string, polygonId: number | string): string {
	return typeof polygonId === 'number'
		? `${fieldName} = ${polygonId}`
		: `${fieldName} = '${String(polygonId).replace(/'/g, "''")}'`;
}

/**
 * Returns a single polygon geometry representing the union of all intersection
 * results between polygon and every intersecting geometry in layer.
 *
 * @param layer - The clip layer (FeatureLayer or GraphicsLayer)
 * @param polygon - The polygon to intersect with
 * @param view - Optional MapView for spatial reference
 * @returns Union of all intersections or null if no intersections found
 */
async function getUnionClipGeometryFromLayer(
	layer: ClipLayer,
	polygon: Polygon,
	view?: MapView
): Promise<Polygon | null> {
	const clipGeometries = await getClipGeometries(layer, polygon, view);

	if (!clipGeometries.length) {
		return null;
	}

	return computeUnionOfIntersections(polygon, clipGeometries);
}

/**
 * Get all clip geometries from the layer that intersect with the polygon.
 *
 * @param layer - The clip layer to query
 * @param polygon - The polygon to check intersection against
 * @param view - Optional MapView for spatial reference
 * @returns Array of geometries that intersect the polygon
 */
async function getClipGeometries(
	layer: ClipLayer,
	polygon: Polygon,
	view?: MapView
): Promise<GeometryUnion[]> {
	if (layer.type === 'feature') {
		return getClipGeometriesFromFeatureLayer(layer as FeatureLayer, polygon, view);
	}

	if (layer.type === 'graphics') {
		return getClipGeometriesFromGraphicsLayer(layer as GraphicsLayer, polygon);
	}

	console.warn(
		'getClipGeometries: unsupported layer type:',
		(layer as unknown as { type: string }).type
	);
	return [];
}

/**
 * Get clip geometries from a FeatureLayer using spatial query.
 *
 * @param layer - The FeatureLayer to query
 * @param polygon - The polygon to intersect with
 * @param view - Optional MapView for spatial reference
 * @returns Array of geometries from query results
 */
async function getClipGeometriesFromFeatureLayer(
	layer: FeatureLayer,
	polygon: Polygon,
	view?: MapView
): Promise<GeometryUnion[]> {
	const q = layer.createQuery();
	q.geometry = polygon;
	q.spatialRelationship = 'intersects';
	q.returnGeometry = true;
	q.outFields = [];
	q.num = 1000;

	if (view?.spatialReference) {
		q.outSpatialReference = view.spatialReference;
	}

	const result = await layer.queryFeatures(q);
	return result.features
		.map((f) => f.geometry as GeometryUnion | null)
		.filter((g): g is GeometryUnion => !!g);
}

/**
 * Get clip geometries from a GraphicsLayer using client-side filtering.
 *
 * @param layer - The GraphicsLayer to filter
 * @param polygon - The polygon to check intersection against
 * @returns Array of geometries that potentially intersect
 */
function getClipGeometriesFromGraphicsLayer(
	layer: GraphicsLayer,
	polygon: Polygon
): GeometryUnion[] {
	const polyExtent = polygon.extent as Extent | null;
	const candidates: GeometryUnion[] = [];

	layer.graphics.forEach((g) => {
		if (!g.geometry) return;
		const geom = g.geometry as GeometryUnion;
		const gExtent = 'extent' in geom ? (geom.extent as Extent | null) : null;
		if (!polyExtent || !gExtent || extentsIntersect(polyExtent, gExtent)) {
			candidates.push(geom);
		}
	});

	return candidates;
}

/**
 * Compute the union of all intersections between polygon and clip geometries.
 *
 * @param polygon - The polygon to intersect with
 * @param clipGeometries - Array of geometries to intersect
 * @returns Union of all polygon intersections or null if none found
 */
function computeUnionOfIntersections(
	polygon: Polygon,
	clipGeometries: GeometryUnion[]
): Polygon | null {
	intersectionOperator.accelerateGeometry(polygon);

	const intersections = intersectionOperator.executeMany(
		clipGeometries,
		polygon
	) as GeometryUnion[];

	if (!intersections.length) {
		return null;
	}

	const polygonIntersections = intersections.filter(
		(g): g is Polygon => !!g && g.type === 'polygon'
	);

	if (!polygonIntersections.length) {
		return null;
	}

	const unionResult = unionOperator.executeMany(polygonIntersections) as
		| GeometryUnion
		| null
		| undefined;

	if (!unionResult || unionResult.type !== 'polygon') {
		return null;
	}

	return unionResult as Polygon;
}

/**
 * Check if two extents intersect using simple numeric comparison.
 *
 * @param a - First extent to check
 * @param b - Second extent to check
 * @returns True if extents intersect, false otherwise
 */
function extentsIntersect(a: Extent, b: Extent): boolean {
	return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}
