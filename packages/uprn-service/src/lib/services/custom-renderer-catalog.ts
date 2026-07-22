import type {
	CustomRenderer,
	CustomRendererClassBreak,
	CustomRendererLod,
	CustomRenderers,
	CustomRenderersSymbolAppearance,
	CustomRendererSymbol
} from '$lib/types/custom-renderers.types';

export type CustomRendererSymbolWithAppearances = CustomRendererSymbol & {
	Appearances: CustomRenderersSymbolAppearance[];
};

/** Pure lookup/catalog layer for authored custom-renderer configuration. */
export class CustomRendererCatalog {
	private readonly data: CustomRenderers;

	constructor(data: CustomRenderers) {
		this.data = data;
	}

	public getRenderer(layerTitle: string, fieldName: string): CustomRenderer | null {
		const featureLayer = this.data.FeatureLayers.find((layer) => layer.Name === layerTitle);
		if (!featureLayer) return null;
		const field = this.data.Fields.find(
			(candidate) => candidate.FeatureLayerId === featureLayer.Id && candidate.Name === fieldName
		);
		if (!field) return null;
		const mapping = this.data.CustomRenderers_Fields.find(
			(candidate) => candidate.FieldId === field.Id
		);
		if (!mapping) return null;
		return (
			this.data.CustomRenderers.find((renderer) => renderer.Id === mapping.CustomRendererId) ?? null
		);
	}

	public hasRenderer(layerTitle: string, fieldName: string): boolean {
		return this.getRenderer(layerTitle, fieldName) !== null;
	}

	public getFieldsWithRenderers(layerTitle: string): string[] {
		const featureLayer = this.data.FeatureLayers.find((layer) => layer.Name === layerTitle);
		if (!featureLayer) return [];
		return this.data.Fields.filter(
			(field) =>
				field.FeatureLayerId === featureLayer.Id &&
				this.data.CustomRenderers_Fields.some((mapping) => mapping.FieldId === field.Id)
		).map((field) => field.Name);
	}

	public getClassBreaks(groupId: number): CustomRendererClassBreak[] {
		const result = this.data.CustomRenderers_ClassBreaks.filter(
			(classBreak) => classBreak.GroupId === groupId
		).sort((left, right) => left.Order - right.Order);
		if (result.length === 0) throw new Error(`Could not find a group with the id ${groupId}`);
		return result;
	}

	public getSymbol(symbolId: number): CustomRendererSymbolWithAppearances {
		const symbol = this.data.CustomRenderers_Symbols.find((candidate) => candidate.Id === symbolId);
		if (!symbol) throw new Error(`Could not find a symbol with the id ${symbolId}`);
		return {
			...symbol,
			Appearances: this.data.CustomRenderers_Symbols_Appearances.filter(
				(appearance) => appearance.SymbolsId === symbolId
			).sort((left, right) => left.Order - right.Order)
		};
	}

	public getLods(groupId: number): CustomRendererLod[] {
		return this.data.CustomRenderers_Lods.filter((lod) => lod.GroupId === groupId).sort(
			(left, right) => left.Lod - right.Lod
		);
	}
}
