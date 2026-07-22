import type { JsonRecord } from './web-map-json';

type LayerWithOriginalId = __esri.Layer & { readonly __uprnOriginalLayerId?: string };

export function setOriginalLayerId(layer: __esri.Layer, json: JsonRecord): void {
	const rawId = json.id;
	const sourceId =
		typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
	if (!sourceId || sourceId === layer.id) return;
	Object.defineProperty(layer as LayerWithOriginalId, '__uprnOriginalLayerId', {
		value: sourceId,
		enumerable: false,
		configurable: true
	});
}

export function getOriginalLayerId(layer: __esri.Layer): string | undefined {
	return (layer as LayerWithOriginalId).__uprnOriginalLayerId;
}
