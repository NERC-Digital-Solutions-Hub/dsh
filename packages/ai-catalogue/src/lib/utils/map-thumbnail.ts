export const ARCGIS_LIGHT_GRAY_BASE_EXPORT_URL =
	'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/export';
export const ARCGIS_LIGHT_GRAY_REFERENCE_EXPORT_URL =
	'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/export';

const EARTH_RADIUS_METRES = 6378137;
const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;
const MIN_WEB_MERCATOR_SPAN_METRES = 1000;
const DEFAULT_PADDING_RATIO = 0.2;
const MIN_EXPORT_PIXEL_RATIO = 2;
const MAX_EXPORT_SIZE_PX = 1200;
const DEFAULT_MIN_OVERLAY_SIZE_PX = 6;
export const REFERENCE_LAYER_MAX_SCALE = 10_000_000;

export interface CatalogueMapBoundingBox {
	westBoundLongitude: number;
	eastBoundLongitude: number;
	southBoundLatitude: number;
	northBoundLatitude: number;
}

export interface NormalisedMapBoundingBox {
	west: number;
	east: number;
	south: number;
	north: number;
}

export interface WebMercatorExtent {
	xmin: number;
	ymin: number;
	xmax: number;
	ymax: number;
}

export interface ArcgisExportExtent extends WebMercatorExtent {
	spatialReference?: {
		wkid?: number;
		latestWkid?: number;
	};
}

export interface ArcgisMapExportResponse {
	href: string;
	width: number;
	height: number;
	extent: ArcgisExportExtent;
	scale?: number;
}

export interface MapExportRequest {
	layers: MapExportLayerRequest[];
	imageWidth: number;
	imageHeight: number;
	boundingBox: NormalisedMapBoundingBox;
	requestedExtent: WebMercatorExtent;
}

export interface MapExportLayerRequest {
	id: 'base' | 'reference';
	url: string;
}

export interface MapOverlayRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function buildMapExportRequest(input: {
	boundingBox: CatalogueMapBoundingBox | null | undefined;
	cssWidth: number;
	cssHeight: number;
	devicePixelRatio?: number;
	paddingRatio?: number;
}): MapExportRequest | null {
	const boundingBox = normaliseBoundingBox(input.boundingBox);

	if (!boundingBox || input.cssWidth <= 0 || input.cssHeight <= 0) {
		return null;
	}

	const imageWidth = Math.min(
		MAX_EXPORT_SIZE_PX,
		Math.max(
			1,
			Math.round(input.cssWidth * Math.max(input.devicePixelRatio ?? 1, MIN_EXPORT_PIXEL_RATIO))
		)
	);
	const imageHeight = Math.min(
		MAX_EXPORT_SIZE_PX,
		Math.max(
			1,
			Math.round(input.cssHeight * Math.max(input.devicePixelRatio ?? 1, MIN_EXPORT_PIXEL_RATIO))
		)
	);
	const requestedExtent = buildPaddedWebMercatorExtent({
		boundingBox,
		aspectRatio: imageWidth / imageHeight,
		paddingRatio: input.paddingRatio ?? DEFAULT_PADDING_RATIO
	});
	const requestedGeographicExtent = webMercatorExtentToGeographic(requestedExtent);
	const sharedParams = {
		bbox: [
			requestedGeographicExtent.west,
			requestedGeographicExtent.south,
			requestedGeographicExtent.east,
			requestedGeographicExtent.north
		].join(','),
		bboxSR: '4326',
		imageSR: '3857',
		size: `${imageWidth},${imageHeight}`,
		format: 'png32',
		f: 'json'
	};

	return {
		layers: [
			{
				id: 'base',
				url: buildLayerExportUrl(ARCGIS_LIGHT_GRAY_BASE_EXPORT_URL, {
					...sharedParams,
					transparent: 'false'
				})
			},
			{
				id: 'reference',
				url: buildLayerExportUrl(ARCGIS_LIGHT_GRAY_REFERENCE_EXPORT_URL, {
					...sharedParams,
					transparent: 'true'
				})
			}
		],
		imageWidth,
		imageHeight,
		boundingBox,
		requestedExtent
	};
}

function buildLayerExportUrl(serviceUrl: string, params: Record<string, string>): string {
	return `${serviceUrl}?${new URLSearchParams(params).toString()}`;
}

export function normaliseBoundingBox(
	boundingBox: CatalogueMapBoundingBox | null | undefined
): NormalisedMapBoundingBox | null {
	if (
		!boundingBox ||
		!isFiniteNumber(boundingBox.westBoundLongitude) ||
		!isFiniteNumber(boundingBox.eastBoundLongitude) ||
		!isFiniteNumber(boundingBox.southBoundLatitude) ||
		!isFiniteNumber(boundingBox.northBoundLatitude)
	) {
		return null;
	}

	const west = clampLongitude(
		Math.min(boundingBox.westBoundLongitude, boundingBox.eastBoundLongitude)
	);
	const east = clampLongitude(
		Math.max(boundingBox.westBoundLongitude, boundingBox.eastBoundLongitude)
	);
	const south = clampLatitude(
		Math.min(boundingBox.southBoundLatitude, boundingBox.northBoundLatitude)
	);
	const north = clampLatitude(
		Math.max(boundingBox.southBoundLatitude, boundingBox.northBoundLatitude)
	);

	return { west, east, south, north };
}

export function parseArcgisMapExportResponse(value: unknown): ArcgisMapExportResponse | null {
	if (!isRecord(value)) {
		return null;
	}

	const { href, width, height, extent } = value;

	if (
		typeof href !== 'string' ||
		href.length === 0 ||
		!isFiniteNumber(width) ||
		!isFiniteNumber(height) ||
		!isWebMercatorExtent(extent)
	) {
		return null;
	}

	return {
		href,
		width,
		height,
		extent,
		...(isFiniteNumber(value.scale) ? { scale: value.scale } : {})
	};
}

export function shouldUseReferenceLayer(scale: number | null | undefined): boolean {
	return isFiniteNumber(scale) && scale <= REFERENCE_LAYER_MAX_SCALE;
}

export function buildOverlayRect(input: {
	boundingBox: NormalisedMapBoundingBox;
	exportExtent: WebMercatorExtent;
	imageWidth: number;
	imageHeight: number;
	minPixelSize?: number;
}): MapOverlayRect | null {
	const { exportExtent, imageWidth, imageHeight } = input;
	const extentWidth = exportExtent.xmax - exportExtent.xmin;
	const extentHeight = exportExtent.ymax - exportExtent.ymin;

	if (extentWidth <= 0 || extentHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
		return null;
	}

	const projectedBoundingBox = geographicBoundingBoxToWebMercator(input.boundingBox);
	const left = ((projectedBoundingBox.xmin - exportExtent.xmin) / extentWidth) * imageWidth;
	const right = ((projectedBoundingBox.xmax - exportExtent.xmin) / extentWidth) * imageWidth;
	const top = ((exportExtent.ymax - projectedBoundingBox.ymax) / extentHeight) * imageHeight;
	const bottom = ((exportExtent.ymax - projectedBoundingBox.ymin) / extentHeight) * imageHeight;
	const minPixelSize = input.minPixelSize ?? DEFAULT_MIN_OVERLAY_SIZE_PX;

	return ensureMinimumRectSize(
		{
			x: Math.min(left, right),
			y: Math.min(top, bottom),
			width: Math.abs(right - left),
			height: Math.abs(bottom - top)
		},
		imageWidth,
		imageHeight,
		minPixelSize
	);
}

function buildPaddedWebMercatorExtent(input: {
	boundingBox: NormalisedMapBoundingBox;
	aspectRatio: number;
	paddingRatio: number;
}): WebMercatorExtent {
	const projectedBoundingBox = geographicBoundingBoxToWebMercator(input.boundingBox);
	const centerX = (projectedBoundingBox.xmin + projectedBoundingBox.xmax) / 2;
	const centerY = (projectedBoundingBox.ymin + projectedBoundingBox.ymax) / 2;
	let width = Math.max(
		projectedBoundingBox.xmax - projectedBoundingBox.xmin,
		MIN_WEB_MERCATOR_SPAN_METRES
	);
	let height = Math.max(
		projectedBoundingBox.ymax - projectedBoundingBox.ymin,
		MIN_WEB_MERCATOR_SPAN_METRES
	);
	const paddingMultiplier = 1 + Math.max(input.paddingRatio, 0) * 2;

	width *= paddingMultiplier;
	height *= paddingMultiplier;

	if (width / height < input.aspectRatio) {
		width = height * input.aspectRatio;
	} else {
		height = width / input.aspectRatio;
	}

	return {
		xmin: centerX - width / 2,
		ymin: centerY - height / 2,
		xmax: centerX + width / 2,
		ymax: centerY + height / 2
	};
}

function geographicBoundingBoxToWebMercator(
	boundingBox: NormalisedMapBoundingBox
): WebMercatorExtent {
	const min = geographicToWebMercator(boundingBox.west, boundingBox.south);
	const max = geographicToWebMercator(boundingBox.east, boundingBox.north);

	return {
		xmin: Math.min(min.x, max.x),
		ymin: Math.min(min.y, max.y),
		xmax: Math.max(min.x, max.x),
		ymax: Math.max(min.y, max.y)
	};
}

function webMercatorExtentToGeographic(extent: WebMercatorExtent): NormalisedMapBoundingBox {
	const min = webMercatorToGeographic(extent.xmin, extent.ymin);
	const max = webMercatorToGeographic(extent.xmax, extent.ymax);

	return {
		west: min.longitude,
		east: max.longitude,
		south: min.latitude,
		north: max.latitude
	};
}

function geographicToWebMercator(longitude: number, latitude: number) {
	const safeLatitude = clampLatitude(latitude);
	const x = (clampLongitude(longitude) * Math.PI * EARTH_RADIUS_METRES) / 180;
	const y = EARTH_RADIUS_METRES * Math.log(Math.tan(Math.PI / 4 + (safeLatitude * Math.PI) / 360));

	return { x, y };
}

function webMercatorToGeographic(x: number, y: number) {
	const longitude = (x / (Math.PI * EARTH_RADIUS_METRES)) * 180;
	const latitude = (Math.atan(Math.exp(y / EARTH_RADIUS_METRES)) * 360) / Math.PI - 90;

	return {
		longitude: clampLongitude(longitude),
		latitude: clampLatitude(latitude)
	};
}

function ensureMinimumRectSize(
	rect: MapOverlayRect,
	imageWidth: number,
	imageHeight: number,
	minPixelSize: number
): MapOverlayRect {
	const centerX = rect.x + rect.width / 2;
	const centerY = rect.y + rect.height / 2;
	const width = Math.max(rect.width, minPixelSize);
	const height = Math.max(rect.height, minPixelSize);

	return {
		x: clamp(centerX - width / 2, 0, Math.max(imageWidth - width, 0)),
		y: clamp(centerY - height / 2, 0, Math.max(imageHeight - height, 0)),
		width: Math.min(width, imageWidth),
		height: Math.min(height, imageHeight)
	};
}

function isWebMercatorExtent(value: unknown): value is ArcgisExportExtent {
	return (
		isRecord(value) &&
		isFiniteNumber(value.xmin) &&
		isFiniteNumber(value.ymin) &&
		isFiniteNumber(value.xmax) &&
		isFiniteNumber(value.ymax)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function clampLatitude(value: number): number {
	return clamp(value, -WEB_MERCATOR_MAX_LATITUDE, WEB_MERCATOR_MAX_LATITUDE);
}

function clampLongitude(value: number): number {
	return clamp(value, -180, 180);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
