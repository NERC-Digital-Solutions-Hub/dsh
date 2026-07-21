import { ArcgisRendererFactory } from '$lib/services/arcgis-renderer-factory';
import { CustomRendererCatalog } from '$lib/services/custom-renderer-catalog';
import type { CustomRenderers } from '$lib/types/custom-renderers.types';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';

/** Coordinates pure renderer configuration lookups with the ArcGIS renderer factory. */
export class CustomRendererService {
	private readonly catalog: CustomRendererCatalog;
	private readonly factory: ArcgisRendererFactory;

	constructor(data: CustomRenderers) {
		this.catalog = new CustomRendererCatalog(data);
		this.factory = new ArcgisRendererFactory(this.catalog);
	}

	public applyCustomRenderer(featureLayer: FeatureLayer, fieldName: string): Promise<void> {
		return this.factory.applyCustomRenderer(featureLayer, fieldName);
	}

	public doesFieldHaveCustomRenderer(featureLayer: FeatureLayer, fieldName: string): boolean {
		return this.catalog.hasRenderer(featureLayer.title ?? '', fieldName);
	}

	public getAllFieldsWithCustomRenderers(featureLayer: FeatureLayer): string[] {
		return this.catalog.getFieldsWithRenderers(featureLayer.title ?? '');
	}
}
