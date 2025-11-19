import * as intersectionOperator from '@arcgis/core/geometry/operators/intersectionOperator.js';
import * as differenceOperator from '@arcgis/core/geometry/operators/differenceOperator.js';
import * as unionOperator from '@arcgis/core/geometry/operators/unionOperator.js';
import Graphic from '@arcgis/core/Graphic.js';

import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import type Polygon from '@arcgis/core/geometry/Polygon.js';
import type Extent from '@arcgis/core/geometry/Extent.js';

interface Piece {
	geometry: Polygon;
	members: Graphic[]; // original clipped polygons that contribute to this region
}

/**
 * Merge/split clipped polygons so that:
 * - Overlaps are split out as separate polygons.
 * - Each final polygon has layerIds/layerTitles listing all layers that cover it.
 * - Polygons that share the same set of layers are unioned together.
 *
 * @param layer - The graphics layer containing polygons to merge
 * @param options - Optional configuration
 * @param options.sourceId - If provided, only process polygons with this sourceId
 * @returns The final graphics that were added to the layer
 */
export function mergeClippedPolygons(
	layer: GraphicsLayer,
	options?: { sourceId?: number | string }
): Graphic[] {
	console.log('[merge-clipped-polygons] merging in layer:', layer.id, 'opts:', options);

	const candidates = filterCandidatePolygons(layer, options?.sourceId);

	if (candidates.length <= 1) return candidates;

	console.log('[merge-clipped-polygons] candidate polygons:', candidates.length);

	const pieces = overlayPolygonsIntoPieces(candidates);

	console.log('[merge-clipped-polygons] overlay pieces count:', pieces.length);

	if (!pieces.length) return [];

	const groups = groupPiecesByLayerSet(pieces);

	console.log('[merge-clipped-polygons] groups by layer set:', groups.size);

	const mergedGraphics = buildMergedGraphics(groups);

	console.log(
		'[merge-clipped-polygons] replacing',
		candidates.length,
		'originals with',
		mergedGraphics.length,
		'final polygons.'
	);

	layer.graphics.removeMany(candidates);
	layer.graphics.addMany(mergedGraphics);

	return mergedGraphics;
}

/* -------------------------------------------------------------------------- */
/*                               Helper methods                               */
/* -------------------------------------------------------------------------- */

type Group = {
	geometries: Polygon[];
	members: Graphic[];
	comboKey: string;
};

/**
 * Filter graphics to find valid polygon candidates for merging.
 *
 * @param layer - The graphics layer to filter
 * @param sourceId - Optional sourceId to filter by
 * @returns Array of candidate graphics
 */
function filterCandidatePolygons(layer: GraphicsLayer, sourceId?: number | string): Graphic[] {
	const allGraphics = layer.graphics.toArray();

	return allGraphics.filter((g) => {
		if (!g.geometry || g.geometry.type !== 'polygon') return false;
		if (!sourceId) return true;
		return g.attributes?.sourceId === sourceId;
	});
}

/**
 * Overlay all candidate polygons into non-overlapping pieces.
 * Each piece represents a region with its contributing members.
 *
 * @param candidates - Array of graphics to overlay
 * @returns Array of non-overlapping pieces
 */
function overlayPolygonsIntoPieces(candidates: Graphic[]): Piece[] {
	let pieces: Piece[] = [];

	for (const candidate of candidates) {
		pieces = processCandidate(candidate, pieces);
	}

	return pieces;
}

/**
 * Process a single candidate polygon against existing pieces.
 *
 * @param candidate - The graphic to process
 * @param pieces - Existing pieces to check against
 * @returns Updated array of pieces
 */
function processCandidate(candidate: Graphic, pieces: Piece[]): Piece[] {
	const geomNew = candidate.geometry as Polygon;
	let remaining: Polygon | null = geomNew;

	if (!remaining) return pieces;

	intersectionOperator.accelerateGeometry(remaining);

	const nextPieces: Piece[] = [];

	for (const piece of pieces) {
		const result = processPieceIntersection(piece, remaining, candidate);
		nextPieces.push(...result.pieces);
		remaining = result.remaining;

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

	return nextPieces;
}

/**
 * Process the intersection between an existing piece and a new polygon.
 *
 * @param piece - The existing piece
 * @param remaining - The remaining geometry of the new polygon
 * @param candidate - The candidate graphic being processed
 * @returns Object containing updated pieces and remaining geometry
 */
function processPieceIntersection(
	piece: Piece,
	remaining: Polygon | null,
	candidate: Graphic
): { pieces: Piece[]; remaining: Polygon | null } {
	const geomOld = piece.geometry;

	if (!remaining) {
		return { pieces: [piece], remaining: null };
	}

	const extentOld = geomOld.extent as Extent;
	const extentNew = remaining.extent as Extent;

	if (!extentsIntersect(extentOld, extentNew)) {
		return { pieces: [piece], remaining };
	}

	const inter = intersectionOperator.execute(geomOld, remaining) as Polygon | null | undefined;

	if (!inter || inter.type !== 'polygon') {
		return { pieces: [piece], remaining };
	}

	const oldOnly = differenceOperator.execute(geomOld, remaining) as Polygon | null | undefined;

	const newOnly = differenceOperator.execute(remaining, geomOld) as Polygon | null | undefined;

	const resultPieces: Piece[] = [];

	if (oldOnly && oldOnly.type === 'polygon') {
		resultPieces.push({
			geometry: oldOnly as Polygon,
			members: piece.members.slice()
		});
	}

	resultPieces.push({
		geometry: inter as Polygon,
		members: [...piece.members, candidate]
	});

	const newRemaining = newOnly && newOnly.type === 'polygon' ? (newOnly as Polygon) : null;

	return { pieces: resultPieces, remaining: newRemaining };
}

/**
 * Group pieces by their layer set (which layers cover that region).
 *
 * @param pieces - Array of pieces to group
 * @returns Map of layer key to group
 */
function groupPiecesByLayerSet(pieces: Piece[]): Map<string, Group> {
	const groups = new Map<string, Group>();

	for (const piece of pieces) {
		const { key, ids } = getLayerKeyFromMembers(piece.members);
		if (ids.length === 0) continue;

		let group = groups.get(key);
		if (!group) {
			group = {
				geometries: [],
				members: piece.members,
				comboKey: key
			};
			groups.set(key, group);
		}

		group.geometries.push(piece.geometry);
	}

	return groups;
}

/**
 * Build final merged graphics from groups.
 * Unions geometries within each group and creates graphics with merged attributes.
 *
 * @param groups - Map of layer key to group
 * @returns Array of merged graphics
 */
function buildMergedGraphics(groups: Map<string, Group>): Graphic[] {
	const mergedGraphics: Graphic[] = [];

	for (const [, group] of groups.entries()) {
		if (!group.geometries.length) continue;

		const unionGeom = unionOperator.executeMany(group.geometries) as Polygon | null | undefined;

		if (!unionGeom || unionGeom.type !== 'polygon') continue;

		const attrs = buildMergedAttributes(group.members);
		const merged = new Graphic({
			geometry: unionGeom as Polygon,
			attributes: attrs,
			symbol: {
				type: 'simple-fill',
				color: [0, 0, 0, 0.3],
				outline: {
					color: [0, 0, 0, 1],
					width: 1
				}
			}
		});

		mergedGraphics.push(merged);
	}

	return mergedGraphics;
}

/**
 * Build a stable key from all layerIds contributing to a piece.
 *
 * @param members - Array of graphics contributing to a piece
 * @returns Object containing the key, layer IDs, and titles
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
			idArr.forEach((v) => {
				if (v) idSet.add(v);
			});
		}

		if (lt) titleSet.add(lt);
		if (Array.isArray(ltArr)) {
			ltArr.forEach((t) => {
				if (t) titleSet.add(t);
			});
		}
	}

	const ids = Array.from(idSet).sort();
	const titles = Array.from(titleSet).sort();
	const key = ids.join('|'); // stable combo id for colours

	return { key, ids, titles };
}

/**
 * Build attributes for a merged polygon representing the union
 * of all regions that share the same layer set.
 *
 * @param members - Array of graphics that contribute to the merged polygon
 * @returns Attributes object with merged layer information
 */
function buildMergedAttributes(members: Graphic[]): Record<string, unknown> {
	const result: Record<string, unknown> = {};
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
			idArr.forEach((v) => {
				if (v) idSet.add(v);
			});
		}

		if (lt) titleSet.add(lt);
		if (Array.isArray(ltArr)) {
			ltArr.forEach((t) => {
				if (t) titleSet.add(t);
			});
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
 * Check if two extents intersect using simple numeric comparison.
 *
 * @param a - First extent to check
 * @param b - Second extent to check
 * @returns True if extents intersect, false otherwise
 */
function extentsIntersect(a: Extent, b: Extent): boolean {
	return !(a.xmax < b.xmin || a.xmin > b.xmax || a.ymax < b.ymin || a.ymin > b.ymax);
}
