import type MapView from '@arcgis/core/views/MapView';

export type ActiveRasterSublayer = {
	id: number;
	title: string;
	mapServiceUrl: string;
};

/**
 * Creates a popup template for raster cell features.
 * The popup performs an identify request against the active visible raster sublayer.
 */
export async function createRasterCellsPopupTemplate(
	mapView: MapView,
	getActiveRasterSublayer: () => ActiveRasterSublayer | null
): Promise<__esri.PopupTemplate> {
	const { default: PopupTemplate } = await import('@arcgis/core/PopupTemplate.js');

	return new PopupTemplate({
		title: 'Cell {gridcode}',
		outFields: ['*'],
		content: async ({ graphic }: { graphic: __esri.Graphic }) => {
			const gridcode = graphic.attributes.gridcode;
			const activeRaster = getActiveRasterSublayer();

			if (!activeRaster) {
				return `
					<b>Gridcode:</b> ${gridcode}<br>
					No active raster layer.
				`;
			}

			const center = graphic.geometry?.extent?.center;
			if (!center) {
				return `
					<b>Gridcode:</b> ${gridcode}<br>
					No geometry center available.
				`;
			}

			const [{ default: IdentifyParameters }, identify] = await Promise.all([
				import('@arcgis/core/rest/support/IdentifyParameters.js'),
				import('@arcgis/core/rest/identify.js')
			]);

			const params = new IdentifyParameters({
				geometry: center,
				tolerance: 1,
				mapExtent: mapView.extent,
				width: mapView.width,
				height: mapView.height,
				dpi: 96,
				returnGeometry: false,
				layerOption: 'visible',
				layerIds: [activeRaster.id],
				spatialReference: mapView.spatialReference
			});

			try {
				const response = await identify.identify(activeRaster.mapServiceUrl, params);
				const hit = response.results?.[0];

				if (!hit) {
					return `
						<b>Gridcode:</b> ${gridcode}<br>
						No raster value found.
					`;
				}

				const attrs = (hit.feature?.attributes ?? {}) as Record<string, unknown>;
				const valueField = findBestRasterValueField(attrs);
				const fixedValue = Number(attrs[valueField ?? '']).toFixed(3);

				return `
					<b>Gridcode:</b> ${gridcode}<br>
					<b>Value:</b> ${valueField ? fixedValue : 'N/A'}
				`;
			} catch (error) {
				console.error('Identify failed', error);
				return `
					<b>Gridcode:</b> ${gridcode}<br>
					Failed to identify raster value.
				`;
			}
		}
	});
}

/**
 * Creates a readable popup template for feature layers by using visible, non-system fields.
 */
export async function createFeatureLayerPopupTemplate(
	layer: __esri.FeatureLayer
): Promise<__esri.PopupTemplate> {
	const { default: PopupTemplate } = await import('@arcgis/core/PopupTemplate.js');

	const hiddenFieldTypes = new Set([
		'oid',
		'global-id',
		'guid',
		'geometry',
		'blob',
		'raster',
		'xml'
	]);

	const fieldInfos: __esri.FieldInfo[] = (layer.fields ?? [])
		.filter((field) => !hiddenFieldTypes.has(field.type))
		.map((field) => {
			const info: __esri.FieldInfo = {
				fieldName: field.name,
				label: field.alias || field.name,
				visible: true
			} as __esri.FieldInfo;

			if (isFloatingNumericFieldType(field.type)) {
				info.format = {
					digitSeparator: true,
					places: 3
				};
			}

			return info;
		});

	return new PopupTemplate({
		title: layer.title ?? '{OBJECTID}',
		outFields: ['*'],
		content: [
			{
				type: 'fields',
				fieldInfos
			}
		]
	});
}

function findBestRasterValueField(attributes: Record<string, unknown>): string | undefined {
	const keys = Object.keys(attributes);

	return (
		keys.find((key) => key.includes('Value')) ??
		keys.find((key) => key.includes('value')) ??
		Object.entries(attributes).find(([, value]) => isNumericValue(value))?.[0]
	);
}

function isNumericValue(value: unknown): boolean {
	if (typeof value === 'number') {
		return Number.isFinite(value);
	}

	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed !== '' && !Number.isNaN(Number(trimmed));
	}

	return false;
}

function isFloatingNumericFieldType(type: string): boolean {
	return type === 'single' || type === 'double';
}
