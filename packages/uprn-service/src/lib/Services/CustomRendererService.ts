import { ImageTileLevelOfDetails } from '$lib/Services/ImageTileLods';
import type {
	CustomRendererClassBreak,
	CustomRenderers,
	CustomRenderersSymbolAppearance,
	CustomRendererSymbol,
	LODSize
} from '$lib/Types/CustomRenderers.types';
import { arcgisImport } from '$lib/Utilities/ArcgisLoader';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type Renderer from '@arcgis/core/renderers/Renderer';

/**
 * ArcGIS renderer/symbol classes loaded from the CDN at runtime (never bundled).
 * The constructor types are derived purely at the type level via `typeof import(...)`,
 * which TypeScript erases — it does not emit a runtime import.
 */
type ArcgisRendererModules = {
	Color: typeof import('@arcgis/core/Color').default;
	ClassBreaksRenderer: typeof import('@arcgis/core/renderers/ClassBreaksRenderer').default;
	SimpleRenderer: typeof import('@arcgis/core/renderers/SimpleRenderer').default;
	SimpleFillSymbol: typeof import('@arcgis/core/symbols/SimpleFillSymbol').default;
	SimpleLineSymbol: typeof import('@arcgis/core/symbols/SimpleLineSymbol').default;
};

type CustomRendererSymbolWithAppearances = CustomRendererSymbol & {
	Appearances: CustomRenderersSymbolAppearance[];
};

type RendererLodSize = {
	lod: number;
	size: number;
};

type DefaultClassBreak = {
	minValue: number | null;
	maxValue: number | null;
	classLabel: string;
	symbolColor: string;
	outlineWidth: number;
	outlineColor: string;
};

const defaultClassBreaks: DefaultClassBreak[] = [
	{
		minValue: 3,
		maxValue: null,
		classLabel: 'Acute',
		symbolColor: '#704489',
		outlineWidth: 0.7,
		outlineColor: '#3A2448'
	},
	{
		minValue: 2,
		maxValue: 3,
		classLabel: 'High',
		symbolColor: '#AA66CD',
		outlineWidth: 0.7,
		outlineColor: '#3A2448'
	},
	{
		minValue: 1,
		maxValue: 2,
		classLabel: 'Relative high',
		symbolColor: '#C29ED7',
		outlineWidth: 0.7,
		outlineColor: '#704489'
	},
	{
		minValue: -1,
		maxValue: 1,
		classLabel: 'Average',
		symbolColor: '#FFEBAF',
		outlineWidth: 0.7,
		outlineColor: '#704489'
	},
	{
		minValue: -2,
		maxValue: -1,
		classLabel: 'Relative low',
		symbolColor: '#FAAA00',
		outlineWidth: 0.7,
		outlineColor: '#704489'
	},
	{
		minValue: -3,
		maxValue: -2,
		classLabel: 'Low',
		symbolColor: '#FF5500',
		outlineWidth: 0.7,
		outlineColor: '#704489'
	},
	{
		minValue: null,
		maxValue: -3,
		classLabel: 'Slight',
		symbolColor: '#E60000',
		outlineWidth: 0.7,
		outlineColor: '#704489'
	}
];
const defaultClassBreakFallbackColor = '#9b9b9b';
const defaultClassBreakFallbackLabel = 'No data';
const defaultClassBreakOutlineLods: RendererLodSize[] = [
	{ lod: 9, size: 0 },
	{ lod: 10, size: 0.1 },
	{ lod: 12, size: 0.2 },
	{ lod: 13, size: 0.3 },
	{ lod: 14, size: 0.4 },
	{ lod: 15, size: 0.5 },
	{ lod: 16, size: 0.8 },
	{ lod: 17, size: 1 }
];
const numericFieldTypes = ['small-integer', 'integer', 'big-integer', 'single', 'double', 'long'];

/**
 * Service responsible for applying custom renderers to feature layers based on a provided configuration.
 */
export class CustomRendererService {
	/** The custom renderers data. */
	readonly #data: CustomRenderers;

	/** ArcGIS renderer/symbol classes, lazily loaded from the CDN on first use. */
	#modules: ArcgisRendererModules | null = null;

	/**
	 * Initializes an instance of CustomRendererService.
	 * @param customRenderersData The custom renderers data.
	 */
	constructor(customRenderersData: CustomRenderers) {
		this.#data = customRenderersData;
	}

	/**
	 * Loads (once) and returns the ArcGIS renderer/symbol classes used to build renderers.
	 * Awaited by the public async entrypoints before any synchronous construction occurs.
	 */
	async #ensureModules(): Promise<ArcgisRendererModules> {
		if (this.#modules) {
			return this.#modules;
		}

		const [Color, ClassBreaksRenderer, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol] =
			await arcgisImport<
				[
					ArcgisRendererModules['Color'],
					ArcgisRendererModules['ClassBreaksRenderer'],
					ArcgisRendererModules['SimpleRenderer'],
					ArcgisRendererModules['SimpleFillSymbol'],
					ArcgisRendererModules['SimpleLineSymbol']
				]
			>([
				'@arcgis/core/Color.js',
				'@arcgis/core/renderers/ClassBreaksRenderer.js',
				'@arcgis/core/renderers/SimpleRenderer.js',
				'@arcgis/core/symbols/SimpleFillSymbol.js',
				'@arcgis/core/symbols/SimpleLineSymbol.js'
			]);

		this.#modules = {
			Color,
			ClassBreaksRenderer,
			SimpleRenderer,
			SimpleFillSymbol,
			SimpleLineSymbol
		};
		return this.#modules;
	}

	/**
	 * Returns the loaded ArcGIS modules, throwing if they have not been loaded yet.
	 * Used by synchronous builder methods that always run after {@link #ensureModules}.
	 */
	#requireModules(): ArcgisRendererModules {
		if (!this.#modules) {
			throw new Error(
				'[custom-renderer-service] ArcGIS modules are not loaded. Call applyCustomRenderer/setCustomOutlines first.'
			);
		}

		return this.#modules;
	}

	public async applyCustomRenderer(featureLayer: FeatureLayer, fieldName: string) {
		await this.#ensureModules();

		// Find the feature layer by name
		const featureLayerRecord = this.#data.FeatureLayers.find(
			(fl) => fl.Name === featureLayer.title
		);

		if (!featureLayerRecord) {
			await this.#applyDefaultClassBreaksRenderer(featureLayer, fieldName);
			return;
		}

		// Find the field by name and feature layer ID
		const fieldRecord = this.#data.Fields.find(
			(f) => f.FeatureLayerId === featureLayerRecord.Id && f.Name === fieldName
		);

		if (!fieldRecord) {
			console.warn(
				`[custom-renderer-service] could not find the field ${fieldName} for feature layer id ${featureLayerRecord.Id}`
			);
			await this.#applyDefaultClassBreaksRenderer(featureLayer, fieldName);
			return;
		}

		// Find the custom renderer field mapping
		const customRendererField = this.#data.CustomRenderers_Fields.find(
			(crf) => crf.FieldId === fieldRecord.Id
		);

		// TODO: Remove this fallback logic after data correction
		// if (!customRendererField) {
		// 	const newfieldRecord = this.#data.Fields.find(
		// 		(f) =>
		// 			f.FeatureLayerId === featureLayerRecord.Id &&
		// 			fieldName.includes(f.Name) &&
		// 			f !== fieldRecord
		// 	);
		// 	console.warn(
		// 		`[custom-renderer-service] could not find custom renderer field for field ${fieldName}. Falling back to similar field ${newfieldRecord?.Name}`
		// 	);
		// 	if (newfieldRecord) {
		// 		customRendererField = this.#data.CustomRenderers_Fields.find(
		// 			(crf) => crf.FieldId === newfieldRecord.Id
		// 		);
		// 	}
		// }

		if (!customRendererField) {
			console.warn(
				`[custom-renderer-service] could not find a custom renderer field for field ${fieldName} in feature layer id ${featureLayerRecord.Id}`
			);
			await this.#applyDefaultClassBreaksRenderer(featureLayer, fieldName);
			return;
		}

		// Find the custom renderer
		const customRenderer = this.#data.CustomRenderers.find(
			(cr) => cr.Id === customRendererField.CustomRendererId
		);

		if (!customRenderer) {
			console.warn(
				`[custom-renderer-service] could not find a custom renderer with the id ${customRendererField.CustomRendererId}`
			);
			await this.#applyDefaultClassBreaksRenderer(featureLayer, fieldName);
			return;
		}

		const customClassBreaks = await this.getRendererClassBreaks(
			customRenderer.ClassBreaksGroupId.toString()
		);
		const customSymbols = await this.getRendererSymbols(customRenderer.SymbolsId.toString());

		const renderer: Renderer = this.#createRenderer(
			customRenderer.CustomRendererType,
			customSymbols,
			customClassBreaks,
			[],
			fieldName
		);

		featureLayer.renderer = renderer;
		this.setCustomOutlines(featureLayer, customRenderer.LodsGroupId);
	}

	public doesFieldHaveCustomRenderer(featureLayer: FeatureLayer, fieldName: string): boolean {
		// Find the feature layer by name
		const featureLayerRecord = this.#data.FeatureLayers.find(
			(fl) => fl.Name === featureLayer.title
		);

		if (!featureLayerRecord) {
			return false;
		}

		// Find the field by name and feature layer ID
		const fieldRecord = this.#data.Fields.find(
			(f) => f.FeatureLayerId === featureLayerRecord.Id && f.Name === fieldName
		);

		if (!fieldRecord) {
			return false;
		}

		// Check if there's a custom renderer for this field
		const customRendererField = this.#data.CustomRenderers_Fields.find(
			(crf) => crf.FieldId === fieldRecord.Id
		);

		return !!customRendererField;
	}

	public getAllFieldsWithCustomRenderers(featureLayer: FeatureLayer): string[] {
		// Find the feature layer by name
		const featureLayerRecord = this.#data.FeatureLayers.find(
			(fl) => fl.Name === featureLayer.title
		);

		if (!featureLayerRecord) {
			return [];
		}

		// Find all fields for this feature layer
		const fieldsForLayer = this.#data.Fields.filter(
			(f) => f.FeatureLayerId === featureLayerRecord.Id
		);

		// Find fields that have custom renderers
		const fieldNames: string[] = [];
		for (const field of fieldsForLayer) {
			const hasCustomRenderer = this.#data.CustomRenderers_Fields.some(
				(crf) => crf.FieldId === field.Id
			);
			if (hasCustomRenderer) {
				fieldNames.push(field.Name);
			}
		}

		return fieldNames;
	}

	public async setCustomOutlines(featureLayer: FeatureLayer, lodsGroupId: number) {
		const { ClassBreaksRenderer, SimpleRenderer } = await this.#ensureModules();

		// Find all LODs for the given group ID, sorted by Lod
		const lodsResult = this.#data.CustomRenderers_Lods.filter(
			(lod) => lod.GroupId === lodsGroupId
		).sort((a, b) => a.Lod - b.Lod);

		if (lodsResult.length === 0) {
			console.warn(`No LODs found for LODs group id ${lodsGroupId}`);
			return;
		}

		const lodSizes = this.#createLodSizes(
			lodsResult.map((lodRecord) => ({
				lod: lodRecord.Lod,
				size: lodRecord.OutlineWidth
			}))
		);

		if (
			featureLayer.renderer instanceof ClassBreaksRenderer ||
			featureLayer.renderer instanceof SimpleRenderer
		) {
			this.#setVisualVariables(featureLayer.renderer, lodSizes);
		}
	}

	public async getRendererClassBreaks(
		classBreakGroupId: string
	): Promise<CustomRendererClassBreak[]> {
		const groupId = parseInt(classBreakGroupId, 10);

		// Find all class breaks for the given group ID, sorted by Order
		const result = this.#data.CustomRenderers_ClassBreaks.filter(
			(cb) => cb.GroupId === groupId
		).sort((a, b) => a.Order - b.Order);

		if (result.length === 0) {
			throw new Error(`Could not find a group with the id ${classBreakGroupId}`);
		}

		return result;
	}

	public async getRendererSymbols(symbolsId: string): Promise<CustomRendererSymbolWithAppearances> {
		const id = parseInt(symbolsId, 10);

		// Find the symbol by ID
		const symbolsResult = this.#data.CustomRenderers_Symbols.find((s) => s.Id === id);

		if (!symbolsResult) {
			throw new Error(`Could not find a symbol with the id ${symbolsId}`);
		}

		// Find all appearances for this symbol, sorted by Order
		const appearancesResult = this.#data.CustomRenderers_Symbols_Appearances.filter(
			(a) => a.SymbolsId === id
		).sort((a, b) => a.Order - b.Order);

		const result: CustomRendererSymbolWithAppearances = {
			...symbolsResult,
			Appearances: appearancesResult
		};

		return result;
	}

	#getLODIndex(levelsOfDetail: { lod: number; scale: number }[], lod: number): number {
		// in ClimateJust, the LODs scale downwards (e.g. LOD 2 size goes upto LOD 1 size; if between 1 and 2, 1 is used).
		// in Esri, the LODs scale upwards (e.g. LOD 1 size goes upto LOD 2 size; if between 2 and 1, 2 is used).
		// to ensure that the intended configuration is used, the LODs are incremented by 1.
		const lodIndex = levelsOfDetail.findIndex((ls) => ls.lod === lod);
		if (lodIndex === -1) {
			return 0;
		}

		return lodIndex < 23 ? lodIndex + 1 : lodIndex;
	}

	#createRenderer(
		rendererTypeId: number,
		customSymbols: CustomRendererSymbolWithAppearances,
		customClassBreaks: CustomRendererClassBreak[],
		lodSizes: LODSize[],
		fieldId: string
	): Renderer {
		switch (rendererTypeId) {
			case 1:
				return this.#createSimpleRenderer(customSymbols, lodSizes);
			case 2:
				return this.#createClassBreaksRenderer(fieldId, customSymbols, customClassBreaks, lodSizes);
			default:
				throw new Error(`Unknown renderer type: ${rendererTypeId}`);
		}
	}

	#createClassBreaksRenderer(
		fieldId: string,
		customSymbols: CustomRendererSymbolWithAppearances,
		customClassBreaks: CustomRendererClassBreak[],
		lodSizes: LODSize[]
	): __esri.ClassBreaksRenderer {
		const { Color, ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol } =
			this.#requireModules();

		const renderer = new ClassBreaksRenderer({
			field: fieldId
		});

		const fmt = (n: number) => Number(n.toFixed(3)).toString();

		const classBreaks = [...customClassBreaks].sort((a, b) => a.Order - b.Order);

		const appearancesByOrder = new Map(
			customSymbols.Appearances.map((appearance) => [appearance.Order, appearance])
		);

		for (const classBreak of classBreaks) {
			const appearance = appearancesByOrder.get(classBreak.Order);

			if (!appearance) {
				console.warn(
					`[custom-renderer-service] no symbol appearance found for class break order ${classBreak.Order}`
				);
				continue;
			}

			const label =
				classBreak.Label || `${fmt(classBreak.ClassMinValue)} – ${fmt(classBreak.ClassMaxValue)}`;

			const symbol = new SimpleFillSymbol({
				color: Color.fromHex(this.#resolveFillColor(appearance.SymbolColor))!,
				outline: new SimpleLineSymbol({
					color: Color.fromHex(this.#resolveOutlineColor(appearance.OutlineColor))!,
					width: appearance.OutlineWidth
				})
			});

			if (this.#isDefaultClassBreak(classBreak)) {
				renderer.defaultLabel = label;
				renderer.defaultSymbol = symbol;
				continue;
			}

			renderer.addClassBreakInfo({
				minValue: classBreak.ClassMinValue,
				maxValue: classBreak.ClassMaxValue,
				label,
				symbol
			});
		}

		this.#setVisualVariables(renderer, lodSizes);

		return renderer;
	}

	#isDefaultClassBreak(classBreak: CustomRendererClassBreak): boolean {
		return (
			classBreak.Order === 0 &&
			(this.#isNoDataClassBreakValue(classBreak.ClassMinValue) ||
				this.#isNoDataClassBreakValue(classBreak.ClassMaxValue))
		);
	}

	#isNoDataClassBreakValue(value: number): boolean {
		return Number.isFinite(value) && value <= -999999;
	}

	#resolveFillColor(color: string | null | undefined): string {
		const normalizedColor = this.#normalizeHexColor(color);

		if (this.#isFullyTransparentHexColor(normalizedColor)) {
			return defaultClassBreakFallbackColor;
		}

		return normalizedColor || defaultClassBreakFallbackColor;
	}

	#resolveOutlineColor(color: string | null | undefined): string {
		const normalizedColor = this.#normalizeHexColor(color);

		if (this.#isFullyTransparentHexColor(normalizedColor)) {
			return '#BCBCBC';
		}

		return normalizedColor || '#BCBCBC';
	}

	#normalizeHexColor(color: string | null | undefined): string {
		return (color ?? '').trim().toUpperCase();
	}

	#isFullyTransparentHexColor(color: string): boolean {
		return /^#[0-9A-F]{8}$/.test(color) && color.endsWith('00');
	}

	async #applyDefaultClassBreaksRenderer(
		featureLayer: FeatureLayer,
		fieldName: string
	): Promise<void> {
		const field = featureLayer.getField(fieldName);
		if (!field) {
			console.warn(
				`[custom-renderer-service] could not apply a default renderer because field ${fieldName} was not found on layer ${featureLayer.title}`
			);
			return;
		}

		if (!numericFieldTypes.includes(field.type)) {
			console.warn(
				`[custom-renderer-service] could not apply a default class breaks renderer because field ${fieldName} is not numeric`
			);
			return;
		}

		let range: { min: number; max: number } | null;
		try {
			range = await this.#getFieldValueRange(featureLayer, fieldName);
		} catch (error) {
			console.warn(
				`[custom-renderer-service] could not query values for default class breaks renderer field ${fieldName}`,
				error
			);
			return;
		}

		if (!range) {
			console.warn(
				`[custom-renderer-service] could not apply a default class breaks renderer because no numeric values were found for field ${fieldName}`
			);
			return;
		}

		featureLayer.renderer = this.#createDefaultClassBreaksRenderer(
			fieldName,
			field.alias ?? fieldName,
			range
		);
	}

	async #getFieldValueRange(
		featureLayer: FeatureLayer,
		fieldName: string
	): Promise<{ min: number; max: number } | null> {
		const minFieldName = 'defaultRendererMinValue';
		const maxFieldName = 'defaultRendererMaxValue';
		const query = featureLayer.createQuery();
		query.returnGeometry = false;
		query.outStatistics = [
			{
				statisticType: 'min',
				onStatisticField: fieldName,
				outStatisticFieldName: minFieldName
			},
			{
				statisticType: 'max',
				onStatisticField: fieldName,
				outStatisticFieldName: maxFieldName
			}
		];

		const result = await featureLayer.queryFeatures(query);
		const attributes = result.features[0]?.attributes;
		const min = this.#toFiniteNumber(attributes?.[minFieldName]);
		const max = this.#toFiniteNumber(attributes?.[maxFieldName]);

		if (min === null || max === null) {
			return null;
		}

		return min <= max ? { min, max } : { min: max, max: min };
	}

	#createDefaultClassBreaksRenderer(
		fieldName: string,
		fieldLabel: string,
		range: { min: number; max: number }
	): __esri.ClassBreaksRenderer {
		const { ClassBreaksRenderer } = this.#requireModules();

		const renderer = new ClassBreaksRenderer({
			field: fieldName,
			defaultLabel: defaultClassBreakFallbackLabel,
			defaultSymbol: this.#createDefaultClassBreakSymbol(defaultClassBreakFallbackColor),
			legendOptions: {
				title: fieldLabel
			}
		});

		if (range.min === range.max) {
			const classBreak = this.#getDefaultClassBreakForValue(range.min);
			renderer.addClassBreakInfo({
				minValue: range.min,
				maxValue: range.max,
				label: classBreak.classLabel,
				symbol: this.#createDefaultClassBreakSymbol(
					classBreak.symbolColor,
					classBreak.outlineColor,
					classBreak.outlineWidth
				)
			});
			this.#setVisualVariables(renderer, this.#createLodSizes(defaultClassBreakOutlineLods));
			return renderer;
		}

		for (const classBreak of defaultClassBreaks) {
			renderer.addClassBreakInfo({
				minValue: this.#getDefaultClassBreakMinValue(classBreak, range),
				maxValue: this.#getDefaultClassBreakMaxValue(classBreak, range),
				label: classBreak.classLabel,
				symbol: this.#createDefaultClassBreakSymbol(
					classBreak.symbolColor,
					classBreak.outlineColor,
					classBreak.outlineWidth
				)
			});
		}

		this.#setVisualVariables(renderer, this.#createLodSizes(defaultClassBreakOutlineLods));

		return renderer;
	}

	#createDefaultClassBreakSymbol(
		color: string,
		outlineColor: string = '#475569',
		outlineWidth: number = 0.5
	): __esri.SimpleFillSymbol {
		const { Color, SimpleFillSymbol, SimpleLineSymbol } = this.#requireModules();

		return new SimpleFillSymbol({
			color: Color.fromHex(color)!,
			outline: new SimpleLineSymbol({
				color: Color.fromHex(outlineColor)!,
				width: outlineWidth
			})
		});
	}

	#getDefaultClassBreakMinValue(
		classBreak: DefaultClassBreak,
		range: { min: number; max: number }
	): number {
		return classBreak.minValue ?? Math.min(range.min, classBreak.maxValue!);
	}

	#getDefaultClassBreakMaxValue(
		classBreak: DefaultClassBreak,
		range: { min: number; max: number }
	): number {
		return classBreak.maxValue ?? Math.max(range.max, classBreak.minValue!);
	}

	#getDefaultClassBreakForValue(value: number): DefaultClassBreak {
		return (
			defaultClassBreaks.find((classBreak) => {
				const minValue = classBreak.minValue ?? Number.NEGATIVE_INFINITY;
				const maxValue = classBreak.maxValue ?? Number.POSITIVE_INFINITY;

				return value >= minValue && value <= maxValue;
			}) ?? defaultClassBreaks[defaultClassBreaks.length - 1]
		);
	}

	#toFiniteNumber(value: unknown): number | null {
		const numericValue =
			typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;

		return Number.isFinite(numericValue) ? numericValue : null;
	}

	#createLodSizes(lods: RendererLodSize[]): LODSize[] {
		const levelsOfDetail = Object.values(ImageTileLevelOfDetails);
		return lods.map(({ lod, size }) => {
			const lodIndex = this.#getLODIndex(levelsOfDetail, lod) - 1;
			return { size, value: levelsOfDetail[lodIndex].scale };
		});
	}

	#createSimpleRenderer(
		customSymbols: CustomRendererSymbolWithAppearances,
		lodSizes: LODSize[]
	): __esri.SimpleRenderer {
		const { Color, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol } = this.#requireModules();

		const symbolColorField = 'SymbolColor';
		const outlineColorField = 'OutlineColor';
		const outlineWidthField = 'OutlineWidth';

		const symbolColor = customSymbols.Appearances[0][symbolColorField];
		const outlineColor = customSymbols.Appearances[0][outlineColorField];
		const outlineWidth = customSymbols.Appearances[0][outlineWidthField];

		const renderer = new SimpleRenderer({
			symbol: new SimpleFillSymbol({
				color: Color.fromHex(symbolColor)!,
				outline: new SimpleLineSymbol({
					color: Color.fromHex(outlineColor),
					width: outlineWidth
				})
			})
		});

		this.#setVisualVariables(renderer, lodSizes);

		return renderer;
	}

	#setVisualVariables(
		renderer: __esri.ClassBreaksRenderer | __esri.SimpleRenderer,
		lodSizes: LODSize[]
	): void {
		const outlineSizeVariable = {
			type: 'size',
			target: 'outline', // Esri supports this, but the local type declaration is too narrow.
			valueExpression: '$view.scale',
			stops: lodSizes
		} as unknown as __esri.SizeVariableProperties & { type: 'size' };

		renderer.visualVariables = [outlineSizeVariable];
	}
}
