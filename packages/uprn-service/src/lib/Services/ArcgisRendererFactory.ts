import { ImageTileLevelOfDetails } from '$lib/Services/ImageTileLods';
import type {
	CustomRendererClassBreak,
	CustomRenderersSymbolAppearance,
	CustomRendererSymbol,
	LODSize
} from '$lib/Types/CustomRenderers.types';
import type { CustomRendererCatalog } from '$lib/Services/CustomRendererCatalog';
import { arcgisImport } from '@dsh/common/arcgis';
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
export class ArcgisRendererFactory {
	readonly #catalog: CustomRendererCatalog;

	/** ArcGIS renderer/symbol classes, lazily loaded from the CDN on first use. */
	#modules: ArcgisRendererModules | null = null;

	/**
	 * Initializes an ArcGIS renderer factory backed by a pure configuration catalog.
	 */
	constructor(catalog: CustomRendererCatalog) {
		this.#catalog = catalog;
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
		const customRenderer = this.#catalog.getRenderer(featureLayer.title ?? '', fieldName);
		if (!customRenderer) {
			console.warn(
				`[custom-renderer-service] no custom renderer configured for ${featureLayer.title}.${fieldName}; applying the default renderer.`
			);
			await this.#applyDefaultClassBreaksRenderer(featureLayer, fieldName);
			return;
		}

		const customClassBreaks = this.#catalog.getClassBreaks(customRenderer.ClassBreaksGroupId);
		const customSymbols = this.#catalog.getSymbol(customRenderer.SymbolsId);

		const renderer: Renderer = this.#createRenderer(
			customRenderer.CustomRendererType,
			customSymbols,
			customClassBreaks,
			[],
			fieldName
		);

		featureLayer.renderer = renderer;
		await this.setCustomOutlines(featureLayer, customRenderer.LodsGroupId);
	}

	public async setCustomOutlines(featureLayer: FeatureLayer, lodsGroupId: number) {
		const { ClassBreaksRenderer, SimpleRenderer } = await this.#ensureModules();

		const lodsResult = this.#catalog.getLods(lodsGroupId);

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
