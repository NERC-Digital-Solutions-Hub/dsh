import type { CustomRendererService } from '$lib/Services/CustomRendererService';
import type { INodeStyleRenderer, NodeStyleChange } from '$lib/Services/INodeStyleRenderer';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';

/**
 * ArcGIS implementation for node-driven source styling.
 */
export class ArcgisNodeStyleRenderer implements INodeStyleRenderer {
	readonly #customRendererService: CustomRendererService;
	readonly #layerViewProvider: LayerViewProvider;

	constructor(layerViewProvider: LayerViewProvider, customRendererService: CustomRendererService) {
		this.#layerViewProvider = layerViewProvider;
		this.#customRendererService = customRendererService;
	}

	public applyStyle(change: NodeStyleChange): void {
		const layer: __esri.Layer | undefined = this.#layerViewProvider.getLayerById(
			change.style.sourceId
		);
		if (!layer) {
			console.warn(
				`[uprn/app] Could not find source for style node ${change.sourceNode.id} with source ID ${change.style.sourceId}`
			);
			return;
		}

		void this.#customRendererService.applyCustomRenderer(
			layer as __esri.FeatureLayer,
			change.style.fieldId
		);
		console.log(
			`[uprn/app] Applied custom renderer for style node ${change.sourceNode.id} on source ${layer.id}`
		);
	}
}
