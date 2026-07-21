import { TreeviewNode } from '$lib/Models/Treeview/index';
import { ArcgisNodeStyleRenderer } from '$lib/Services/ArcgisNodeStyleRenderer';
import type { CustomRendererService } from '$lib/Services/CustomRendererService';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import { describe, expect, it, vi } from 'vitest';

describe('ArcgisNodeStyleRenderer', () => {
	it('applies a style binding through the custom renderer service', () => {
		const layer = { id: 'source' };
		const layerViewProvider = {
			getLayerById: vi.fn(() => layer)
		} as unknown as LayerViewProvider;
		const customRendererService = {
			applyCustomRenderer: vi.fn()
		} as unknown as CustomRendererService;
		const renderer = new ArcgisNodeStyleRenderer(layerViewProvider, customRendererService);
		const node = new TreeviewNode('field-node', 'Field node');

		renderer.applyStyle({
			sourceNode: node,
			style: {
				kind: 'field',
				sourceId: 'source',
				fieldId: 'field'
			}
		});

		expect(layerViewProvider.getLayerById).toHaveBeenCalledWith('source');
		expect(customRendererService.applyCustomRenderer).toHaveBeenCalledWith(layer, 'field');
	});

	it('warns without throwing when the style source is missing', () => {
		const layerViewProvider = {
			getLayerById: vi.fn(() => undefined)
		} as unknown as LayerViewProvider;
		const customRendererService = {
			applyCustomRenderer: vi.fn()
		} as unknown as CustomRendererService;
		const renderer = new ArcgisNodeStyleRenderer(layerViewProvider, customRendererService);
		const node = new TreeviewNode('field-node', 'Field node');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		renderer.applyStyle({
			sourceNode: node,
			style: {
				kind: 'field',
				sourceId: 'missing-source',
				fieldId: 'field'
			}
		});

		expect(warn).toHaveBeenCalledWith(
			'[uprn/app] Could not find source for style node field-node with source ID missing-source'
		);
		expect(customRendererService.applyCustomRenderer).not.toHaveBeenCalled();
	});
});
