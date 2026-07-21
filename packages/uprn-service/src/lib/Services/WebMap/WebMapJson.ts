export type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown): JsonRecord {
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		return value as JsonRecord;
	}
	throw new Error('Webmap JSON must be an object.');
}

export function asOptionalRecord(value: unknown): JsonRecord | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as JsonRecord)
		: undefined;
}

export function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

export function getString(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

export function getNumber(value: unknown): number | undefined {
	return typeof value === 'number' ? value : undefined;
}

export function getBoolean(value: unknown): boolean | undefined {
	return typeof value === 'boolean' ? value : undefined;
}

export function getStringArray(value: unknown): string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

/** Normalizes authored web-map JSON before passing it to ArcGIS WebMap.fromJSON. */
export function getWebMapJsonForArcgis(json: JsonRecord): JsonRecord {
	if (hasParquetLayers(json)) {
		return {
			...json,
			baseMap: undefined,
			initialState: getParquetCompatibleInitialState(asOptionalRecord(json.initialState)),
			spatialReference: undefined
		};
	}
	return {
		...json,
		baseMap: getBaseMapJsonForArcgis(asOptionalRecord(json.baseMap))
	};
}

export function applyParquetCompatibleMapDefaults(webmap: __esri.WebMap, json: JsonRecord): void {
	if (hasParquetLayers(json)) webmap.basemap = 'gray-vector';
}

function getParquetCompatibleInitialState(initialState: JsonRecord | undefined): JsonRecord {
	return {
		...initialState,
		viewpoint: {
			targetGeometry: {
				spatialReference: { wkid: 4326 },
				xmin: -11,
				ymin: 49,
				xmax: 3,
				ymax: 61
			}
		}
	};
}

function hasParquetLayers(json: JsonRecord): boolean {
	return asArray(json.operationalLayers).some(hasParquetLayer);
}

function hasParquetLayer(layerJson: unknown): boolean {
	const json = asOptionalRecord(layerJson);
	if (!json) return false;
	const layerType = getString(json.layerType) ?? getString(json.type);
	return (
		layerType === 'ParquetLayer' ||
		layerType === 'parquet' ||
		asArray(json.layers).some(hasParquetLayer)
	);
}

function getBaseMapJsonForArcgis(baseMap: JsonRecord | undefined): JsonRecord | undefined {
	if (!baseMap) return undefined;
	const baseMapLayers = asArray(baseMap.baseMapLayers);
	if (baseMapLayers.length === 0) return baseMap;
	const hasVisibleLayer = baseMapLayers.some((layerJson) => {
		const layer = asRecord(layerJson);
		return (
			getBoolean(layer.visibility) ??
			getBoolean(layer.visible) ??
			getBoolean(layer.defaultVisibility) ??
			true
		);
	});
	if (hasVisibleLayer) return baseMap;
	return {
		...baseMap,
		baseMapLayers: baseMapLayers.map((layerJson) => ({
			...asRecord(layerJson),
			visibility: true
		}))
	};
}
