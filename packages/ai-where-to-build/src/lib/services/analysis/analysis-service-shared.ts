export type AnalyserServiceContext = {
	mapView: __esri.MapView;
	graphicLayer: __esri.GraphicsLayer;
};

export const PARCELS_LAYER_ID = '19a9760b651-layer-105';

export function createAnalysisRunId(kind: string, selectedObjectIds: number[]): string {
	return `${kind}-${selectedObjectIds.join('-')}-${Date.now()}`;
}

export function prepareAnalysisRun(graphicLayer: __esri.GraphicsLayer): void {
	graphicLayer.removeAll();
}

export function tagAnalysisGraphics(graphics: __esri.Graphic[], analysisRunId: string): void {
	for (const graphic of graphics) {
		graphic.attributes ??= {};
		graphic.attributes.analysisRunId = analysisRunId;
	}
}

export function goToGraphics(mapView: __esri.MapView, graphics: __esri.Graphic[]): void {
	const geometries = graphics.map((graphic) => graphic.geometry).filter((geometry) => !!geometry);
	if (!geometries.length) {
		return;
	}

	mapView.goTo(geometries).catch((error) => console.warn('goTo failed:', error));
}

export function flattenLayers(layers: __esri.Layer[]): __esri.Layer[] {
	const result: __esri.Layer[] = [];
	for (const layer of layers) {
		if (layer.type === 'group') {
			result.push(...flattenLayers((layer as __esri.GroupLayer).layers.toArray()));
		} else if (layer.type === 'feature') {
			result.push(layer);
		}
	}
	return result;
}

export function generateColorFromId(id: string, alpha = 0.3): number[] {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}

	const r = (hash >> 0) & 0xff;
	const g = (hash >> 8) & 0xff;
	const b = (hash >> 16) & 0xff;

	return [r, g, b, alpha];
}

export function createFillSymbol(
	colorId: string,
	alpha: number = 0.3,
	outlineColor: number[] = [255, 0, 0, 1],
	outlineWidth: number = 2
) {
	return {
		type: 'simple-fill' as const,
		color: generateColorFromId(colorId, alpha),
		outline: {
			color: outlineColor,
			width: outlineWidth
		}
	};
}

export function createPopupTemplate() {
	return {
		title: 'Clipped region',
		content: [
			{
				type: 'custom',
				creator: (event: __esri.PopupTemplateCreatorEvent) => {
					const graphic = event.graphic;
					const titles: string[] = graphic.attributes.layerTitles ?? [];
					const values: string[] = graphic.attributes.layerValues ?? [];

					const table = document.createElement('table');
					table.className = 'esri-widget__table';

					const tbody = document.createElement('tbody');

					const headerRow = document.createElement('tr');
					const thLayer = document.createElement('th');
					const thValue = document.createElement('th');
					thLayer.textContent = 'Layer';
					thValue.textContent = 'Value';
					headerRow.appendChild(thLayer);
					headerRow.appendChild(thValue);
					tbody.appendChild(headerRow);

					titles.forEach((title, idx) => {
						const tr = document.createElement('tr');

						const tdTitle = document.createElement('td');
						tdTitle.textContent = title;

						const tdValue = document.createElement('td');
						tdValue.textContent = values[idx] ?? '';

						tr.appendChild(tdTitle);
						tr.appendChild(tdValue);
						tbody.appendChild(tr);
					});

					table.appendChild(tbody);
					return table;
				}
			}
		]
	};
}

export function getParcelsLayer(mapView: __esri.MapView): __esri.FeatureLayer | null {
	const parcelsLayer = mapView.map?.findLayerById(PARCELS_LAYER_ID) as
		| __esri.FeatureLayer
		| undefined;
	if (parcelsLayer) {
		console.log('Parcels Layer:', parcelsLayer.title);
	}
	return parcelsLayer ?? null;
}

export function styleMergedPolygons(mergedPolygons: __esri.Graphic[]): void {
	for (const graphic of mergedPolygons) {
		const key = graphic.attributes.layerTitles.join('; ');
		graphic.symbol = createFillSymbol(key, 0.3, [0, 0, 0, 1], 1);
		graphic.popupTemplate = createPopupTemplate();
	}
}
