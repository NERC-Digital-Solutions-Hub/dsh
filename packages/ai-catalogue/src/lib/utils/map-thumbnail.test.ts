import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	buildMapExportRequest,
	buildOverlayRect,
	normaliseBoundingBox,
	parseArcgisMapExportResponse,
	shouldUseReferenceLayer
} from './map-thumbnail.ts';

const ukBoundingBox = {
	westBoundLongitude: -5,
	eastBoundLongitude: 2,
	southBoundLatitude: 50,
	northBoundLatitude: 56
};

test('builds a padded ArcGIS export request and overlay for a valid UK bbox', () => {
	const request = buildMapExportRequest({
		boundingBox: ukBoundingBox,
		cssWidth: 300,
		cssHeight: 180,
		devicePixelRatio: 2
	});

	assert.ok(request);
	assert.equal(request.imageWidth, 600);
	assert.equal(request.imageHeight, 360);
	assert.deepEqual(
		request.layers.map((layer) => layer.id),
		['base', 'reference']
	);

	const baseUrl = new URL(request.layers[0].url);
	const referenceUrl = new URL(request.layers[1].url);
	assert.equal(baseUrl.searchParams.get('bboxSR'), '4326');
	assert.equal(baseUrl.searchParams.get('imageSR'), '3857');
	assert.equal(baseUrl.searchParams.get('format'), 'png32');
	assert.equal(baseUrl.searchParams.get('transparent'), 'false');
	assert.equal(referenceUrl.searchParams.get('transparent'), 'true');
	assert.equal(referenceUrl.searchParams.get('bbox'), baseUrl.searchParams.get('bbox'));
	assert.equal(referenceUrl.searchParams.get('bboxSR'), baseUrl.searchParams.get('bboxSR'));
	assert.equal(referenceUrl.searchParams.get('imageSR'), baseUrl.searchParams.get('imageSR'));
	assert.equal(referenceUrl.searchParams.get('size'), baseUrl.searchParams.get('size'));

	const overlay = buildOverlayRect({
		boundingBox: request.boundingBox,
		exportExtent: request.requestedExtent,
		imageWidth: request.imageWidth,
		imageHeight: request.imageHeight
	});

	assert.ok(overlay);
	assert.ok(overlay.width > 0);
	assert.ok(overlay.height > 0);
	assert.ok(overlay.x >= 0);
	assert.ok(overlay.y >= 0);
});

test('zero-area bboxes still create a request and a minimum visible overlay', () => {
	const request = buildMapExportRequest({
		boundingBox: {
			westBoundLongitude: -2.24,
			eastBoundLongitude: -2.24,
			southBoundLatitude: 53.48,
			northBoundLatitude: 53.48
		},
		cssWidth: 300,
		cssHeight: 300,
		devicePixelRatio: 1
	});

	assert.ok(request);

	const overlay = buildOverlayRect({
		boundingBox: request.boundingBox,
		exportExtent: request.requestedExtent,
		imageWidth: request.imageWidth,
		imageHeight: request.imageHeight,
		minPixelSize: 8
	});

	assert.ok(overlay);
	assert.equal(overlay.width, 8);
	assert.equal(overlay.height, 8);
});

test('uses minimum export pixel ratio for sharper labels', () => {
	const request = buildMapExportRequest({
		boundingBox: ukBoundingBox,
		cssWidth: 300,
		cssHeight: 300,
		devicePixelRatio: 1
	});

	assert.ok(request);
	assert.equal(request.imageWidth, 600);
	assert.equal(request.imageHeight, 600);
	assert.equal(new URL(request.layers[0].url).searchParams.get('size'), '600,600');
	assert.equal(new URL(request.layers[1].url).searchParams.get('size'), '600,600');
});

test('uses device pixel ratio for square thumbnail exports', () => {
	const request = buildMapExportRequest({
		boundingBox: ukBoundingBox,
		cssWidth: 360,
		cssHeight: 360,
		devicePixelRatio: 2
	});

	assert.ok(request);
	assert.equal(request.imageWidth, 720);
	assert.equal(request.imageHeight, 720);
	assert.equal(new URL(request.layers[0].url).searchParams.get('size'), '720,720');
	assert.equal(new URL(request.layers[1].url).searchParams.get('size'), '720,720');
});

test('caps very large thumbnail exports', () => {
	const request = buildMapExportRequest({
		boundingBox: ukBoundingBox,
		cssWidth: 1200,
		cssHeight: 1200,
		devicePixelRatio: 2
	});

	assert.ok(request);
	assert.equal(request.imageWidth, 1200);
	assert.equal(request.imageHeight, 1200);
	assert.equal(new URL(request.layers[0].url).searchParams.get('size'), '1200,1200');
	assert.equal(new URL(request.layers[1].url).searchParams.get('size'), '1200,1200');
});

test('invalid or non-finite bboxes are rejected', () => {
	assert.equal(normaliseBoundingBox(null), null);
	assert.equal(
		normaliseBoundingBox({
			westBoundLongitude: Number.NaN,
			eastBoundLongitude: 2,
			southBoundLatitude: 50,
			northBoundLatitude: 56
		}),
		null
	);
	assert.equal(
		buildMapExportRequest({
			boundingBox: ukBoundingBox,
			cssWidth: 0,
			cssHeight: 180
		}),
		null
	);
});

test('latitude is clamped to the Web Mercator-safe range', () => {
	const request = buildMapExportRequest({
		boundingBox: {
			westBoundLongitude: -10,
			eastBoundLongitude: 10,
			southBoundLatitude: 89,
			northBoundLatitude: 91
		},
		cssWidth: 300,
		cssHeight: 300
	});

	assert.ok(request);
	assert.equal(request.boundingBox.south, 85.05112878);
	assert.equal(request.boundingBox.north, 85.05112878);
});

test('overlay placement uses the returned export extent', () => {
	const request = buildMapExportRequest({
		boundingBox: ukBoundingBox,
		cssWidth: 300,
		cssHeight: 300
	});

	assert.ok(request);

	const largerReturnedExtent = {
		xmin: request.requestedExtent.xmin - 1000000,
		ymin: request.requestedExtent.ymin - 1000000,
		xmax: request.requestedExtent.xmax + 1000000,
		ymax: request.requestedExtent.ymax + 1000000
	};
	const requestedOverlay = buildOverlayRect({
		boundingBox: request.boundingBox,
		exportExtent: request.requestedExtent,
		imageWidth: request.imageWidth,
		imageHeight: request.imageHeight
	});
	const returnedOverlay = buildOverlayRect({
		boundingBox: request.boundingBox,
		exportExtent: largerReturnedExtent,
		imageWidth: request.imageWidth,
		imageHeight: request.imageHeight
	});

	assert.ok(requestedOverlay);
	assert.ok(returnedOverlay);
	assert.ok(returnedOverlay.width < requestedOverlay.width);
	assert.ok(returnedOverlay.height < requestedOverlay.height);
});

test('parses valid ArcGIS export responses and rejects malformed responses', () => {
	const parsed = parseArcgisMapExportResponse({
		href: 'https://example.test/map.png',
		width: 600,
		height: 600,
		extent: {
			xmin: -1,
			ymin: -2,
			xmax: 3,
			ymax: 4,
			spatialReference: { wkid: 102100, latestWkid: 3857 }
		},
		scale: 12345
	});

	assert.ok(parsed);
	assert.equal(parsed.href, 'https://example.test/map.png');
	assert.equal(parsed.scale, 12345);
	assert.equal(parseArcgisMapExportResponse({ href: '', width: 600 }), null);
});

test('uses reference layer only at local and regional scales', () => {
	assert.equal(shouldUseReferenceLayer(10_000_000), true);
	assert.equal(shouldUseReferenceLayer(9_999_999), true);
	assert.equal(shouldUseReferenceLayer(10_000_001), false);
	assert.equal(shouldUseReferenceLayer(undefined), false);
	assert.equal(shouldUseReferenceLayer(Number.NaN), false);
});
