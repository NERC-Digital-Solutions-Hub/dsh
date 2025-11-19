// clip-and-merge.ts

import * as intersectionOperator from '@arcgis/core/geometry/operators/intersectionOperator.js';
import * as differenceOperator from '@arcgis/core/geometry/operators/differenceOperator.js';
import * as unionOperator from '@arcgis/core/geometry/operators/unionOperator.js';
import Graphic from '@arcgis/core/Graphic.js';

import type FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import type MapView from '@arcgis/core/views/MapView.js';
import type Polygon from '@arcgis/core/geometry/Polygon.js';
import type Extent from '@arcgis/core/geometry/Extent.js';
import type { GeometryUnion } from '@arcgis/core/unionTypes.js';

type InputLayer = FeatureLayer | GraphicsLayer;
type ClipLayer = FeatureLayer | GraphicsLayer;

interface ClipAndMergeOptions {
	view?: MapView;
	inputLayer: InputLayer;
	polygonId: number | string;
	idField?: string;
	clipLayers: ClipLayer[];
	targetLayer: GraphicsLayer;
	/** Optional symbol factory based on combo of layers */
	symbolForCombo?: (
		comboKey: string,
		layerIds: string[],
		layerTitles: string[]
	) => __esri.SimpleFillSymbolProperties;
}

interface Piece {
	geometry: Polygon;
	/** “Member” graphics are just in-memory, not on a layer */
	members: Graphic[];
}

/**
 * One-pass tool:
 * 1. Get the input polygon (parcel).
 * 2. For each clip layer, get features intersecting the parcel and clip them to the parcel.
 * 3. Overlay/split all clipped pieces so overlaps become separate regions.
 * 4. Group by layer combination, union within each group, and add final graphics to targetLayer.
 *
 * Returns the final graphics that were added.
 */
export async function clipAndMergePolygons(options: ClipAndMergeOptions): Promise<Graphic[]> {
	const { view, inputLayer, polygonId, idField, clipLayers, targetLayer, symbolForCombo } = options;

	// 1. Get the parcel polygon
	const polygon = await getPolygonGeometryById(inputLayer, polygonId, idField, view);
	if (!polygon) {
		console.warn('clipAndMergePolygon: polygon not found for id:', polygonId);
		return [];
	}
	if (polygon.type !== 'polygon') {
		console.warn('clipAndMergePolygon: input geometry is not a polygon.');
		return [];
	}

	// use view SR if available to standardize everything
	const sr = view?.spatialReference ?? polygon.spatialReference;
	if (view && polygon.spatialReference && sr && polygon.spatialReference.wkid !== sr.wkid) {
		console.warn(
			'clipAndMergePolygon: input polygon SR does not match view SR; ' +
				'ensure queries use outSpatialReference = view.spatialReference.'
		);
	}

	// speed up repeated intersections with the parcel
	intersectionOperator.accelerateGeometry(polygon);

	// 2. Collect all clipped pieces from all clip layers in parallel
	const piecesPerLayer = await Promise.all(
		clipLayers.map((layer) => collectClippedPiecesForLayer(layer, polygon, sr, polygonId))
	);

	const initialCandidates = piecesPerLayer.flat(); // Graphic[]

	if (!initialCandidates.length) {
		console.info('clipAndMergePolygon: no clip geometries intersect the polygon.');
		return [];
	}

	// 3. Overlay + group-by-layer-set (your mergeClippedPolygons logic, but in-memory)
	const finalGraphics = overlayAndGroupCandidates(initialCandidates, symbolForCombo);

	// 4. Push into target layer
	if (view && view.map && !view.map.layers.includes(targetLayer)) {
		view.map.add(targetLayer);
	}
	targetLayer.addMany(finalGraphics);

	return finalGraphics;
}

/* -------------------------------------------------------------------------- */
/*                               Helper methods                               */
/* -------------------------------------------------------------------------- */

import type { default as FeatureLayerType } from '@arcgis/core/layers/FeatureLayer.js';

async function getPolygonGeometryById(
	layer: InputLayer,
	polygonId: number | string,
	explicitIdField: string | undefined,
	view?: MapView
): Promise<Polygon | null> {
	if (layer.type === 'feature') {
		const fl = layer as FeatureLayerType;
		const fieldName = explicitIdField || fl.objectIdField || 'OBJECTID';

		const q = fl.createQuery();
		q.where =
			typeof polygonId === 'number'
				? `${fieldName} = ${polygonId}`
				: `${fieldName} = '${String(polygonId).replace(/'/g, "''")}'`;
		q.returnGeometry = true;
		q.outFields = ['*'];
		q.num = 1;

		if (view?.spatialReference) {
			q.outSpatialReference = view.spatialReference;
		}

		const result = await fl.queryFeatures(q);
		const feature = result.features[0];
		const geom = feature?.geometry;
		return geom && geom.type === 'polygon' ? (geom as Polygon) : null;
	}

	if (layer.type === 'graphics') {
		const gl = layer as GraphicsLayer;
		const fieldName = explicitIdField || 'id';

		const graphic = gl.graphics.find((g) => {
			const attrs = g.attributes || {};
			const val = attrs[fieldName];
			return val === polygonId || String(val) === String(polygonId);
		});

		const geom = graphic?.geometry;
		return geom && geom.type === 'polygon' ? (geom as Polygon) : null;
	}

	console.warn('getPolygonGeometryById: unsupported layer type:', (layer as any).type);
	return null;
}

/**
 * For a given clip layer, return clipped pieces (Graphics) already intersected
 * with the input polygon. These are NOT added to any layer; they’re just
 * in-memory candidates for the overlay step.
 */
async function collectClippedPiecesForLayer(
	layer: ClipLayer,
	polygon: Polygon,
	sr: __esri.SpatialReference,
	sourceId: number | string
): Promise<Graphic[]> {
	const pieces: Graphic[] = [];

	if (layer.type === 'feature') {
		const fl = layer as FeatureLayer;
		const q = fl.createQuery();

		q.geometry = polygon;
		q.spatialRelationship = 'intersects';
		q.returnGeometry = true;
		q.outFields = [];
		q.num = 2000; // adjust as needed

		if (sr) {
			q.outSpatialReference = sr;
		}

		const result = await fl.queryFeatures(q);
		const clipGeoms: GeometryUnion[] = result.features
			.map((f) => f.geometry as GeometryUnion | null)
			.filter((g): g is GeometryUnion => !!g);

		if (!clipGeoms.length) return pieces;

		// intersect all features from this layer with the parcel in one shot
		const intersections = intersectionOperator.executeMany(clipGeoms, polygon) as GeometryUnion[];

		intersections.forEach((g) => {
			if (!g || g.type !== 'polygon') return;
			pieces.push(
				new Graphic({
					geometry: g as Polygon,
					attributes: {
						sourceId,
						clipped: true,
						layerId: layer.id,
						layerTitle: layer.title
					}
				})
			);
		});

		return pieces;
	}

	if (layer.type === 'graphics') {
		const gl = layer as GraphicsLayer;
		const polyExtent = polygon.extent as Extent | null;

		const candidates: GeometryUnion[] = [];

		gl.graphics.forEach((g) => {
			if (!g.geometry) return;
			const geom = g.geometry as GeometryUnion;
			const gExtent = (geom as any).extent as Extent | null;
			if (!polyExtent || !gExtent || extentsIntersect(polyExtent, gExtent)) {
				candidates.push(geom);
			}
		});

		if (!candidates.length) return pieces;

		const intersections = intersectionOperator.executeMany(candidates, polygon) as GeometryUnion[];

		intersections.forEach((g) => {
			if (!g || g.type !== 'polygon') return;
			pieces.push(
				new Graphic({
					geometry: g as Polygon,
					attributes: {
						sourceId,
						clipped: true,
						layerId: layer.id,
						layerTitle: layer.title
					}
				})
			);
		});

		return pieces;
	}

	console.warn('collectClippedPiecesForLayer: unsupported layer type:', (layer as any).type);
	return pieces;
}

/**
 * Overlay & grouping logic (based on your mergeClippedPolygons), but operates
 * on in-memory Graphics and returns final Graphics without touching layers.
 */
function overlayAndGroupCandidates(
	candidates: Graphic[],
	symbolForCombo?: (
		comboKey: string,
		layerIds: string[],
		layerTitles: string[]
	) => __esri.SimpleFillSymbolProperties
): Graphic[] {
	const n = candidates.length;
	if (n <= 1) return candidates;

	let pieces: Piece[] = [];

	// --- Step 1: overlay all candidates into non-overlapping Pieces ---
	for (const candidate of candidates) {
		const geomNew = candidate.geometry as Polygon;
		let remaining: Polygon | null = geomNew;

		if (!remaining) continue;

		intersectionOperator.accelerateGeometry(remaining);

		const nextPieces: Piece[] = [];

		for (const piece of pieces) {
			const geomOld = piece.geometry;

			if (!remaining) {
				nextPieces.push(piece);
				continue;
			}

			const extentOld = geomOld.extent as Extent;
			const extentNew = remaining.extent as Extent;

			if (!extentsIntersect(extentOld, extentNew)) {
				nextPieces.push(piece);
				continue;
			}

			const inter = intersectionOperator.execute(geomOld, remaining) as Polygon | null | undefined;

			if (!inter || inter.type !== 'polygon') {
				nextPieces.push(piece);
				continue;
			}

			const oldOnly = differenceOperator.execute(geomOld, remaining) as Polygon | null | undefined;

			const newOnly = differenceOperator.execute(remaining, geomOld) as Polygon | null | undefined;

			if (oldOnly && oldOnly.type === 'polygon') {
				nextPieces.push({
					geometry: oldOnly as Polygon,
					members: piece.members.slice()
				});
			}

			nextPieces.push({
				geometry: inter as Polygon,
				members: [...piece.members, candidate]
			});

			remaining = newOnly && newOnly.type === 'polygon' ? (newOnly as Polygon) : null;
			if (remaining) {
				intersectionOperator.accelerateGeometry(remaining);
			}
		}

		if (remaining) {
			nextPieces.push({
				geometry: remaining,
				members: [candidate]
			});
		}

		pieces = nextPieces;
	}

	if (!pieces.length) return [];

	// --- Step 2: group pieces by layer set (layerIds) ---

	type Group = {
		geometries: Polygon[];
		members: Graphic[];
		comboKey: string;
		ids: string[];
		titles: string[];
	};

	const groups = new Map<string, Group>();

	for (const piece of pieces) {
		const { key, ids, titles } = getLayerKeyFromMembers(piece.members);
		if (ids.length === 0) continue;

		let group = groups.get(key);
		if (!group) {
			group = {
				geometries: [],
				members: piece.members,
				comboKey: key,
				ids,
				titles
			};
			groups.set(key, group);
		}

		group.geometries.push(piece.geometry);
	}

	// --- Step 3: union geometries within each group & build final graphics ---

	const mergedGraphics: Graphic[] = [];

	for (const [key, group] of groups.entries()) {
		if (!group.geometries.length) continue;

		const unionGeom = unionOperator.executeMany(group.geometries) as Polygon | null | undefined;

		if (!unionGeom || unionGeom.type !== 'polygon') continue;

		const attrs = buildMergedAttributes(group.members);
		const symbol =
			symbolForCombo?.(key, group.ids, group.titles) ??
			({
				type: 'simple-fill',
				color: colorFromId(key, 0.3),
				outline: {
					type: 'simple-line',
					color: [0, 0, 0, 1],
					width: 1
				}
			} as __esri.SimpleFillSymbolProperties);

		const merged = new Graphic({
			geometry: unionGeom as Polygon,
			attributes: attrs,
			symbol
		});

		mergedGraphics.push(merged);
	}

	return mergedGraphics;
}

/**
 * Build a stable key from all layerIds contributing to a piece.
 */
function getLayerKeyFromMembers(members: Graphic[]): {
	key: string;
	ids: string[];
	titles: string[];
} {
	const idSet = new Set<string>();
	const titleSet = new Set<string>();

	for (const g of members) {
		const attrs = g.attributes ?? {};
		const id = attrs.layerId as string | undefined;
		const idArr = attrs.layerIds as string[] | undefined;
		const lt = attrs.layerTitle as string | undefined;
		const ltArr = attrs.layerTitles as string[] | undefined;

		if (id) idSet.add(id);
		if (Array.isArray(idArr)) {
			idArr.forEach((v) => v && idSet.add(v));
		}

		if (lt) titleSet.add(lt);
		if (Array.isArray(ltArr)) {
			ltArr.forEach((t) => t && titleSet.add(t));
		}
	}

	const ids = Array.from(idSet).sort();
	const titles = Array.from(titleSet).sort();
	const key = ids.join('|');

	return { key, ids, titles };
}

/**
 * Build attributes for a merged polygon representing the union
 * of all regions that share the same layer set.
 */
function buildMergedAttributes(members: Graphic[]): any {
	const result: any = {};
	if (!members.length) return result;

	const sampleAttrs = members[0].attributes ?? {};

	Object.assign(result, sampleAttrs);

	if ('sourceId' in sampleAttrs) {
		result.sourceId = sampleAttrs.sourceId;
	}
	if ('clipped' in sampleAttrs) {
		result.clipped = sampleAttrs.clipped;
	}

	const idSet = new Set<string>();
	const titleSet = new Set<string>();

	for (const g of members) {
		const attrs = g.attributes ?? {};
		const id = attrs.layerId as string | undefined;
		const idArr = attrs.layerIds as string[] | undefined;
		const lt = attrs.layerTitle as string | undefined;
		const ltArr = attrs.layerTitles as string[] | undefined;

		if (id) idSet.add(id);
		if (Array.isArray(idArr)) {
			idArr.forEach((v) => v && idSet.add(v));
		}

		if (lt) titleSet.add(lt);
		if (Array.isArray(ltArr)) {
			ltArr.forEach((t) => t && titleSet.add(t));
		}
	}

	const ids = Array.from(idSet).sort();
	const titles = Array.from(titleSet).sort();

	result.layerIds = ids;
	result.layerTitles = titles;
	result.layerTitlesCsv = titles.join(', ');

	return result;
}

/**
 * Simple numeric extent intersection check (no geometryEngine).
 */
function extentsIntersect(a: Extent, b: Extent): boolean {
	return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}

/**
 * Stable RGBA colour from a string ID (your earlier approach).
 */
function colorFromId(id: string, alpha = 0.3): [number, number, number, number] {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const r = (hash >> 0) & 0xff;
	const g = (hash >> 8) & 0xff;
	const b = (hash >> 16) & 0xff;
	return [r, g, b, alpha];
}
