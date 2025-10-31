import { browser } from '$app/environment';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { type Database } from 'sql.js';

export class CustomRendererService {
	#db: Database = null!;
	#isInitialised: boolean = false;

	async init(connectionString: string) {
		if (!browser) {
			console.warn(
				'[CustomRendererService] init called in non-browser environment. Skipping initialization.'
			);
			return;
		}

		if (this.#isInitialised) {
			return;
		}

		const dbInstance: Response = await fetch(connectionString);
		const [{ default: initSqlJs }, { default: sqlWasmUrl }] = await Promise.all([
			import('sql.js'),
			import('sql.js/dist/sql-wasm.wasm?url')
		]);

		const SQL = await initSqlJs({
			locateFile: (f) => (f === 'sql-wasm.wasm' ? sqlWasmUrl : f)
		});

		const buffer = await dbInstance.arrayBuffer();
		this.#db = new SQL.Database(new Uint8Array(buffer));
		this.#isInitialised = true;
	}

	async applyCustomRenderer(featureLayer: FeatureLayer, fieldName: string) {
		this.#ensureInitialised();
	}

	// async setCustomOutlines(featureLayer: FeatureLayer, rendererTables: Map<string, FeatureLayer>) {
	// 	const featureClassesTable = rendererTables.get(NdshRenderersSettings.FeatureClasses);
	// 	if (!featureClassesTable) {
	// 		throw new Error('Could not find the FeatureClasses table');
	// 	}

	// 	const featureClassesTableQuery = await featureClassesTable.queryFeatures({
	// 		where: `FeatureClassName = '${featureLayer.title}'`,
	// 		outFields: ['FeatureClassId']
	// 	});
	// 	if (featureClassesTableQuery.features.length === 0) {
	// 		return;
	// 	}
	// 	const featureClassId = featureClassesTableQuery.features[0].attributes['FeatureClassId'];
	// 	if (!featureClassId) {
	// 		//throw new Error(`Could not find the feature class id for ${featureLayer.title}`);
	// 		return;
	// 	}

	// 	const featureClassesOutlinesTable = rendererTables.get(
	// 		NdshRenderersSettings.FeatureClassesOutlines
	// 	);
	// 	if (!featureClassesOutlinesTable) {
	// 		throw new Error('Could not find the FeatureClassesOutlines table');
	// 	}

	// 	const featureClassesOutlinesTableQuery = await featureClassesOutlinesTable.queryFeatures({
	// 		where: `FeatureClassId = ${featureClassId}`,
	// 		outFields: ['*']
	// 	});

	// 	const lodSizes: LODSize[] = [];
	// 	const levelsOfDetail = Object.values(ImageTileLevelOfDetails);

	// 	featureClassesOutlinesTableQuery.features.forEach((feature) => {
	// 		if (feature.attributes['FeatureClassId'] !== featureClassId) {
	// 			return;
	// 		}

	// 		const size: number = feature.attributes['Size'];
	// 		const lod: number = feature.attributes['Lod'];
	// 		const lodIndex: number = this.#getLODIndex(levelsOfDetail, lod) - 1;
	// 		lodSizes.push({ size, value: levelsOfDetail[lodIndex].scale });
	// 	});

	// 	if (
	// 		featureLayer.renderer instanceof ClassBreaksRenderer ||
	// 		featureLayer.renderer instanceof SimpleRenderer
	// 	) {
	// 		this.#setVisualVariables(featureLayer.renderer, lodSizes);
	// 	}
	// }

	// async createSymbology(
	// 	fieldId: string,
	// 	rendererId: string,
	// 	rendererTables: Map<string, FeatureLayer>
	// ): Promise<Renderer> {
	// 	try {
	// 		const rendererClassBreaksAttributes = await this.getRendererClassBreaksAttributes(
	// 			rendererId,
	// 			rendererTables
	// 		);
	// 		const rendererTypeId = rendererClassBreaksAttributes['RendererTypeId'];

	// 		const lodSizes = await this.getLODs(rendererTypeId, rendererTables);
	// 		const rendererTypesAttributes = await this.getRendererTypesAttributes(
	// 			rendererTypeId,
	// 			rendererTables
	// 		);

	// 		return this.createRenderer(
	// 			rendererTypesAttributes,
	// 			rendererClassBreaksAttributes,
	// 			lodSizes,
	// 			fieldId
	// 		);
	// 	} catch (error) {
	// 		console.error('Error creating symbology:', error);
	// 		throw error;
	// 	}
	// }

	// async getRendererClassBreaksAttributes(
	// 	rendererId: string,
	// 	rendererTables: Map<string, FeatureLayer>
	// ): Promise<any> {
	// 	const rendererClassBreaksTable = rendererTables.get(NdshRenderersSettings.RendererClassBreaks);
	// 	if (!rendererClassBreaksTable) {
	// 		throw new Error('Could not find the RendererClassBreaks table');
	// 	}

	// 	const query = await rendererClassBreaksTable.queryFeatures({
	// 		where: `RendererId = '${rendererId}'`,
	// 		outFields: ['*']
	// 	});

	// 	if (query.features.length === 0) {
	// 		throw new Error(`Could not find the renderer with the id ${rendererId}`);
	// 	}

	// 	return query.features[0].attributes;
	// }

	// async getRendererTypesAttributes(
	// 	rendererTypeId: string,
	// 	rendererTables: Map<string, FeatureLayer>
	// ): Promise<any> {
	// 	const rendererTypesTable = rendererTables.get(NdshRenderersSettings.RendererTypes);
	// 	if (!rendererTypesTable) {
	// 		throw new Error('Could not find the RendererTypes table');
	// 	}

	// 	const query = await rendererTypesTable.queryFeatures({
	// 		where: `RendererTypeId = '${rendererTypeId}'`,
	// 		outFields: ['*']
	// 	});

	// 	if (query.features.length === 0) {
	// 		throw new Error(`Could not find the renderer type with the id ${rendererTypeId}`);
	// 	}

	// 	return query.features[0].attributes;
	// }

	// async getLODs(
	// 	rendererTypeId: string,
	// 	rendererTables: Map<string, FeatureLayer>
	// ): Promise<LODSize[]> {
	// 	const rendererOutlinesTable = rendererTables.get(NdshRenderersSettings.RendererOutlines);
	// 	if (!rendererOutlinesTable) {
	// 		throw new Error('Could not find the RendererOutlines table');
	// 	}

	// 	const query = await rendererOutlinesTable.queryFeatures({
	// 		where: `RendererTypeId = '${rendererTypeId}'`,
	// 		outFields: ['*']
	// 	});

	// 	return this.extractLODSize(rendererTypeId, query);
	// }

	// extractLODSize(rendererTypeId: string, query: FeatureSet): LODSize[] {
	// 	const lodSizes: LODSize[] = [];
	// 	const levelsOfDetail = Object.values(ImageTileLevelOfDetails);

	// 	query.features.forEach((feature) => {
	// 		if (feature.attributes['RendererTypeId'] !== rendererTypeId) {
	// 			return;
	// 		}

	// 		const size: number = feature.attributes['Size'];
	// 		const lod: number = feature.attributes['LOD'];
	// 		const lodIndex: number = this.#getLODIndex(levelsOfDetail, lod);
	// 		lodSizes.push({ size, value: levelsOfDetail[lodIndex].scale });
	// 	});

	// 	return lodSizes;
	// }

	// #getLODIndex(levelsOfDetail: any, lod: number): number {
	// 	// in ClimateJust, the LODs scale downwards (e.g. LOD 2 size goes upto LOD 1 size; if between 1 and 2, 1 is used).
	// 	// in Esri, the LODs scale upwards (e.g. LOD 1 size goes upto LOD 2 size; if between 2 and 1, 2 is used).
	// 	// to ensure that the intended configuration is used, the LODs are incremented by 1.
	// 	const lodIndex = levelsOfDetail.findIndex((ls) => ls.lod === lod);
	// 	if (lodIndex === -1) {
	// 		return 0;
	// 	}

	// 	return lodIndex < 23 ? lodIndex + 1 : lodIndex;
	// }

	// private createRenderer(
	// 	rendererTypesAttributes: any,
	// 	rendererClassBreaksAttributes: any,
	// 	lodSizes: LODSize[],
	// 	fieldId: string
	// ): Renderer {
	// 	const renderType = rendererTypesAttributes['Type'];

	// 	switch (renderType) {
	// 		case 'simple':
	// 			return this.#createSimpleRenderer(rendererTypesAttributes, lodSizes);
	// 		case 'classBreaks':
	// 			return this.#createClassBreaksRenderer(
	// 				fieldId,
	// 				rendererClassBreaksAttributes,
	// 				rendererTypesAttributes,
	// 				lodSizes
	// 			);
	// 		default:
	// 			throw new Error(`Unknown renderer type: ${renderType}`);
	// 	}
	// }

	// #createClassBreaksRenderer(
	// 	fieldId: string,
	// 	rendererClassBreaksAttributes: any,
	// 	rendererTypesAttributes: any,
	// 	lodSizes: LODSize[]
	// ): ClassBreaksRenderer {
	// 	const classMinValueField = 'ClassMinValue';
	// 	const classMaxValueField = 'ClassMaxValue';
	// 	const symbolColorField = 'SymbolColor';
	// 	const outlineColorField = 'OutlineColor';
	// 	const outlineWidthField = 'OutlineWidth';
	// 	const totalClasses = rendererTypesAttributes['Classes'];

	// 	const renderer = new ClassBreaksRenderer({
	// 		field: fieldId
	// 	});

	// 	for (let i = 1; i <= totalClasses; i++) {
	// 		const minValue = rendererClassBreaksAttributes[classMinValueField + i];
	// 		const maxValue = rendererClassBreaksAttributes[classMaxValueField + i];
	// 		const symbolColor = rendererTypesAttributes[symbolColorField + i];
	// 		const outlineColor = rendererTypesAttributes[outlineColorField + i];
	// 		const outlineWidth = rendererTypesAttributes[outlineWidthField + i];
	// 		renderer.addClassBreakInfo({
	// 			minValue: minValue,
	// 			maxValue: maxValue,
	// 			symbol: new SimpleFillSymbol({
	// 				color: Color.fromHex(symbolColor),
	// 				outline: new SimpleLineSymbol({
	// 					color: Color.fromHex(outlineColor),
	// 					width: outlineWidth
	// 				})
	// 			})
	// 		});
	// 	}

	// 	this.#setVisualVariables(renderer, lodSizes);

	// 	return renderer;
	// }

	// #createSimpleRenderer(rendererTypesAttributes: any, lodSizes: LODSize[]): SimpleRenderer {
	// 	const symbolColorField = 'SymbolColor1';
	// 	const outlineColorField = 'OutlineColor1';
	// 	const outlineWidthField = 'OutlineWidth1';

	// 	const symbolColor = rendererTypesAttributes[symbolColorField];
	// 	const outlineColor = rendererTypesAttributes[outlineColorField];
	// 	const outlineWidth = rendererTypesAttributes[outlineWidthField];

	// 	const renderer = new SimpleRenderer({
	// 		symbol: new SimpleFillSymbol({
	// 			color: Color.fromHex(symbolColor),
	// 			outline: new SimpleLineSymbol({
	// 				color: Color.fromHex(outlineColor),
	// 				width: outlineWidth
	// 			})
	// 		})
	// 	});

	// 	this.#setVisualVariables(renderer, lodSizes);

	// 	return renderer;
	// }

	// #setVisualVariables(renderer: ClassBreaksRenderer | SimpleRenderer, lodSizes: LODSize[]): void {
	// 	renderer.visualVariables = [
	// 		{
	// 			type: 'size',
	// 			target: 'outline', // this is right, Ersi's type declaration for the VisualVariable is incorrect.
	// 			valueExpression: '$view.scale',
	// 			stops: lodSizes
	// 		} as any
	// 	];
	// }

	async getCustomRenderer() { // TODO: This is a test.
		this.#ensureInitialised();

		const stmt = this.#db.prepare('SELECT * FROM CustomRenderers');
		const rows = [];
		while (stmt.step()) {
			rows.push(stmt.getAsObject()); // {col1: val1, col2: val2, ...}
		}
		stmt.free();

		console.table(rows);
		return rows;
	}

	#ensureInitialised() {
		if (!this.#isInitialised) {
			throw new Error('CustomRendererService is not initialized');
		}

		if (!this.#db) {
			throw new Error('Database instance is not available');
		}
	}
}
