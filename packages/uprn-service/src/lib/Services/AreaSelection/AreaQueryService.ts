import type { IWebMapService } from '$lib/Services/IWebMapService';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import type { AreaSelectionFieldInfo } from '$lib/Types/Selection.types';

type AreaLayerField = { name: string };

type QueryableAreaLayer = (__esri.FeatureLayer | __esri.Sublayer) & {
	id: string;
	objectIdField: string;
	uid?: string;
	fields?: AreaLayerField[];
	fieldsIndex?: { get: (fieldName: string) => AreaLayerField | null | undefined };
	getField?: (fieldName: string) => AreaLayerField | null | undefined;
	queryFeatures: (query: __esri.QueryProperties) => Promise<__esri.FeatureSet>;
};

/** Resolves configured area fields and performs cached, layer-agnostic name/code queries. */
export class AreaQueryService {
	private readonly layerViewProvider: LayerViewProvider;
	private readonly webMapService: IWebMapService | null;
	private readonly fieldInfoByLayerId = new Map<string, AreaSelectionFieldInfo>();
	private readonly cachedNames = new Map<string, Map<number, string>>();

	constructor(
		layerViewProvider: LayerViewProvider,
		fieldInfos: AreaSelectionFieldInfo[],
		webMapService: IWebMapService | null = null
	) {
		this.layerViewProvider = layerViewProvider;
		this.webMapService = webMapService;
		this.setFieldInfos(fieldInfos);
	}

	public setFieldInfos(fieldInfos: AreaSelectionFieldInfo[]): void {
		this.fieldInfoByLayerId.clear();
		for (const info of fieldInfos) this.fieldInfoByLayerId.set(info.id, info);
	}

	public getNameField(layerId: string): string | null {
		const info = this.fieldInfoByLayerId.get(layerId);
		if (!info) {
			console.warn(`[area-query-service] no name field configured for layer ${layerId}`);
			return null;
		}
		return info.nameField;
	}

	public getCodeField(layerId: string): string | null {
		const info = this.fieldInfoByLayerId.get(layerId);
		if (!info) {
			console.warn(`[area-query-service] no code field configured for layer ${layerId}`);
			return null;
		}
		return info.codeField;
	}

	public async getNames(layerId: string, ids: number[]): Promise<string[]> {
		if (ids.length === 0) return [];
		const nameField = this.getNameField(layerId);
		const layer = this.getQueryableLayer(layerId, false);
		if (!nameField || !layer) return ids.map(() => '');

		const cacheKey = layer.uid ?? layer.id;
		let cache = this.cachedNames.get(cacheKey);
		if (!cache) {
			cache = new Map<number, string>();
			this.cachedNames.set(cacheKey, cache);
		}

		const names: (string | undefined)[] = new Array(ids.length);
		const idToIndex = new Map<number, number>();
		const missingIds: number[] = [];
		ids.forEach((id, index) => {
			idToIndex.set(id, index);
			const cached = cache.get(id);
			if (cached === undefined) missingIds.push(id);
			else names[index] = cached;
		});
		if (missingIds.length === 0) return names.map((name) => name ?? '');

		const objectIdField = layer.objectIdField;
		const resolvedNameField = this.resolveFieldName(layer, nameField);
		try {
			const result = await layer.queryFeatures({
				objectIds: missingIds,
				outFields: [resolvedNameField, objectIdField],
				returnGeometry: false
			});
			for (const feature of result.features) {
				const id = getAttributeValue(feature.attributes, objectIdField) as number;
				const name = (getAttributeValue(feature.attributes, resolvedNameField) as string) ?? '';
				const index = idToIndex.get(id);
				if (index !== undefined) {
					names[index] = name;
					cache.set(id, name);
				}
			}
		} catch (error) {
			console.warn('[area-query-service] failed to query area names.', error);
		}
		return names.map((name) => name ?? '');
	}

	public async getCodes(layerId: string, ids: number[]): Promise<string[]> {
		if (ids.length === 0) return [];
		const codeField = this.getCodeField(layerId);
		const layer = this.getQueryableLayer(layerId);
		if (!codeField || !layer) return ids.map(() => '');

		const objectIdField = layer.objectIdField;
		const resolvedCodeField = this.resolveFieldName(layer, codeField);
		const idToIndex = new Map(ids.map((id, index) => [id, index]));
		const codes = new Array<string>(ids.length).fill('');
		try {
			const result = await layer.queryFeatures({
				objectIds: ids,
				outFields: [resolvedCodeField, objectIdField],
				returnGeometry: false
			});
			for (const feature of result.features) {
				const id = getAttributeValue(feature.attributes, objectIdField) as number;
				const index = idToIndex.get(id);
				if (index !== undefined) {
					codes[index] = (getAttributeValue(feature.attributes, resolvedCodeField) as string) ?? '';
				}
			}
		} catch (error) {
			console.warn('[area-query-service] failed to query area codes.', error);
		}
		return codes;
	}

	public canQuery(layerId: string): boolean {
		return this.getQueryableLayer(layerId, false) !== null;
	}

	public clear(): void {
		this.cachedNames.clear();
		this.fieldInfoByLayerId.clear();
	}

	private getQueryableLayer(layerId: string, shouldWarn = true): QueryableAreaLayer | null {
		const layer =
			this.layerViewProvider.getLayerById(layerId) ?? this.webMapService?.getLayerById(layerId);
		if (!layer || !('queryFeatures' in layer) || !('objectIdField' in layer)) {
			if (shouldWarn) {
				console.warn(`[area-query-service] no queryable feature layer found for ${layerId}.`);
			}
			return null;
		}
		return layer as QueryableAreaLayer;
	}

	private resolveFieldName(layer: QueryableAreaLayer, fieldName: string): string {
		const directField = layer.getField?.(fieldName);
		if (directField?.name) return directField.name;
		const indexedField = layer.fieldsIndex?.get(fieldName);
		if (indexedField?.name) return indexedField.name;
		const lowerFieldName = fieldName.toLowerCase();
		return (
			layer.fields?.find((field) => field.name.toLowerCase() === lowerFieldName)?.name ?? fieldName
		);
	}
}

function getAttributeValue(
	attributes: Record<string, unknown> | null | undefined,
	fieldName: string
): unknown {
	if (!attributes) return undefined;
	if (fieldName in attributes) return attributes[fieldName];
	const lowerFieldName = fieldName.toLowerCase();
	const matchingKey = Object.keys(attributes).find((key) => key.toLowerCase() === lowerFieldName);
	return matchingKey ? attributes[matchingKey] : undefined;
}
