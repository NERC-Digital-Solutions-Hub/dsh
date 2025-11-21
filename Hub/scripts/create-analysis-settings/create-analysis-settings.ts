// create-analysis-settings.ts
import Configs from './config.json' with { type: 'json' };

import {
	LayerAnalysisSettings,
	WeightedLayerAnalysisSettings,
	EnumFieldLayerAnalysisSettings,
	NumericFieldLayerAnalysisSettings,
	FieldValue,
	LayerBufferZone
} from '../../src/lib/models/apps/ai-where-to-build/layer-analysis-settings';

import { getItem } from '@esri/arcgis-rest-portal';
import {
	queryFeatures,
	getService,
	getLayer,
	IQueryFeaturesResponse
} from '@esri/arcgis-rest-feature-service';
import { ApiKeyManager, IAuthenticationManager } from '@esri/arcgis-rest-request';
import { writeFile } from 'node:fs/promises';

type Config = {
	itemId: string;
	type: 'enum' | 'numeric' | 'weight';
	fieldName?: string;
};

type LayerAnalysisSettingsWithName = LayerAnalysisSettings & { __name: string };

// Simple concrete implementations so we can new() the abstract classes
class EnumLayerSettingsImpl extends EnumFieldLayerAnalysisSettings {}
class NumericLayerSettingsImpl extends NumericFieldLayerAnalysisSettings {}

// Optional auth
const authentication: IAuthenticationManager | undefined = process.env.ARCGIS_API_KEY
	? ApiKeyManager.fromKey(process.env.ARCGIS_API_KEY)
	: undefined;

async function main() {
	const settings: LayerAnalysisSettingsWithName[] = [];

	for (const config of Configs as Config[]) {
		let layerSetting: LayerAnalysisSettingsWithName;

		switch (config.type) {
			case 'enum':
				layerSetting = await createEnumFieldLayerAnalysisSettings(config.itemId, config.fieldName!);
				break;
			case 'numeric':
				layerSetting = await createNumericFieldLayerAnalysisSettings(
					config.itemId,
					config.fieldName!
				);
				break;
			case 'weight':
				layerSetting = await createWeightedLayerAnalysisSettings(config.itemId);
				break;
			default:
				throw new Error(`Unknown layer analysis settings type: ${config.type}`);
		}

		settings.push(layerSetting);
	}

	// Write result JSON (each object has __name)
	await writeFile('layer-analysis-settings.json', JSON.stringify(settings, null, 2), 'utf8');
	console.log('Layer analysis settings written to layer-analysis-settings.json');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

/**
 * Given a portal item + a field name, find the first layer in the
 * feature service that contains that field.
 *
 * Returns:
 *  - layerUrl: full layer URL (…/FeatureServer/{id})
 *  - layerTitle: a nice title to use for __name
 *  - actualFieldName: the exact field name as defined on the layer
 */
async function resolveLayerForField(
	itemId: string,
	fieldName: string
): Promise<{
	layerUrl: string;
	layerTitle: string;
	actualFieldName: string;
}> {
	const item = await getItem(itemId, authentication ? { authentication } : undefined);

	if (!item.url) {
		throw new Error(`Item ${itemId} does not have a service URL.`);
	}

	const itemUrl = item.url.replace(/\/+$/, '');

	// Does the item URL already point at a specific layer (…/FeatureServer/0)?
	const layerUrlMatch = itemUrl.match(/\/(FeatureServer|MapServer)\/(\d+)$/);
	const serviceRoot = layerUrlMatch ? itemUrl.replace(/\/\d+$/, '') : itemUrl;

	// Helper to check a specific layer for our field
	const checkLayer = async (layerUrl: string) => {
		const layer = await getLayer({
			url: layerUrl,
			...(authentication ? { authentication } : {})
		});

		const fields = layer.fields ?? [];
		const match = fields.find((f: any) => f.name.toLowerCase() === fieldName.toLowerCase());

		if (match) {
			const title = layer.name || item.title || item.id || itemId;
			return {
				layerUrl,
				layerTitle: title,
				actualFieldName: match.name as string
			};
		}

		return null;
	};

	// 1) If the item already points at a specific layer, try that first
	if (layerUrlMatch) {
		const maybe = await checkLayer(itemUrl);
		if (maybe) {
			return maybe;
		}
	}

	// 2) Otherwise (or if that didn’t work), walk all layers in the service
	const serviceInfo = await getService({
		url: serviceRoot,
		...(authentication ? { authentication } : {})
	});

	const layers = (serviceInfo.layers ?? []) as Array<{ id: number }>;

	for (const l of layers) {
		const layerUrl = `${serviceRoot}/${l.id}`;
		const maybe = await checkLayer(layerUrl);
		if (maybe) {
			return maybe;
		}
	}

	throw new Error(
		`Field "${fieldName}" not found in any layer of service ${serviceRoot} (item ${itemId}).`
	);
}

/**
 * ENUM:
 *  - Find the correct layer that contains the field.
 *  - Query all unique values for that field.
 *  - Build FieldValue[] with default weights and no buffers.
 */
async function createEnumFieldLayerAnalysisSettings(
	itemId: string,
	fieldName: string
): Promise<LayerAnalysisSettingsWithName> {
	const { layerUrl, layerTitle, actualFieldName } = await resolveLayerForField(itemId, fieldName);

	const queryOptions: any = {
		url: layerUrl,
		where: '1=1',
		outFields: [actualFieldName],
		returnDistinctValues: true,
		returnGeometry: false,
		...(authentication ? { authentication } : {})
	};

	const response = (await queryFeatures(queryOptions)) as IQueryFeaturesResponse;

	const rawValues = (response.features ?? []).map((f: any) => f.attributes?.[actualFieldName]);

	const uniqueValues = Array.from(
		new Set(rawValues.filter((v) => v !== null && v !== undefined && v !== ''))
	);

	const fieldValues: FieldValue[] = uniqueValues.map((value) => ({
		value,
		label: String(value),
		weight: 1, // default weight
		buffers: [] // no buffers by default
	}));

	const enumSettings = new EnumLayerSettingsImpl(itemId, actualFieldName, fieldValues);

	return Object.assign(enumSettings, { __name: layerTitle });
}

/**
 * NUMERIC:
 *  - Find the layer containing the numeric field.
 *  - Query min/max via outStatistics.
 *  - Create NumericFieldLayerAnalysisSettings with default weight,
 *    plus minValue / maxValue properties for use in UI.
 */
async function createNumericFieldLayerAnalysisSettings(
	itemId: string,
	fieldName: string
): Promise<LayerAnalysisSettingsWithName> {
	const { layerUrl, layerTitle, actualFieldName } = await resolveLayerForField(itemId, fieldName);

	const queryOptions: any = {
		url: layerUrl,
		where: '1=1',
		outStatistics: [
			{
				statisticType: 'min',
				onStatisticField: actualFieldName,
				outStatisticFieldName: 'minValue'
			},
			{
				statisticType: 'max',
				onStatisticField: actualFieldName,
				outStatisticFieldName: 'maxValue'
			}
		],
		returnGeometry: false,
		...(authentication ? { authentication } : {})
	};

	const response = (await queryFeatures(queryOptions)) as IQueryFeaturesResponse;
	const statsFeature = response.features?.[0];

	const min = statsFeature?.attributes?.minValue;
	const max = statsFeature?.attributes?.maxValue;

	const defaultWeight = 1;

	const numericSettings = new NumericLayerSettingsImpl(itemId, actualFieldName, defaultWeight);

	const numericWithRange = Object.assign(numericSettings, {
		minValue: typeof min === 'number' ? min : 0,
		maxValue: typeof max === 'number' ? max : 0
	});

	return Object.assign(numericWithRange, { __name: layerTitle });
}

/**
 * WEIGHT:
 *  - Doesn’t depend on any field, so it just creates a simple
 *    WeightedLayerAnalysisSettings with default weight and no buffers.
 *  - Uses the item title as __name.
 */
async function createWeightedLayerAnalysisSettings(
	itemId: string
): Promise<LayerAnalysisSettingsWithName> {
	const item = await getItem(itemId, authentication ? { authentication } : undefined);

	const title = item.title || item.name || item.id || itemId;

	const defaultWeight = 1;
	const bufferZones: LayerBufferZone[] = []; // no buffer zones by default

	const weightedSettings = new WeightedLayerAnalysisSettings(itemId, defaultWeight, bufferZones);

	return Object.assign(weightedSettings, { __name: title });
}
