import { createTreeviewNodes } from '$lib/utilities/create-treeview-nodes';
import { TreeviewNodeLayerType, TreeviewNodeTypology } from '$lib/types/treeview.types';
import { describe, expect, it } from 'vitest';

describe('createTreeviewNodes', () => {
	it('gives raster child variables source-member rendering and field selection capabilities', () => {
		const [dataset] = createTreeviewNodes([
			{
				id: 'raster-dataset',
				displayName: 'Raster dataset',
				type: TreeviewNodeLayerType.TileLayer,
				typology: TreeviewNodeTypology.DatasetRaster,
				layerId: 'raster-source',
				children: [
					{
						id: 'raster-dataset-0',
						displayName: 'Raster member 0',
						type: TreeviewNodeLayerType.Field,
						typology: TreeviewNodeTypology.Variable,
						variableId: '0',
						children: []
					}
				]
			}
		]);

		const [variable] = dataset.children;

		expect(variable.capabilities.render).toEqual({
			kind: 'source-member',
			sourceId: 'raster-source',
			memberId: '0',
			drawStateNodeId: 'raster-dataset-0'
		});
		expect(variable.capabilities.selection).toEqual({
			kind: 'field',
			sourceId: 'raster-source',
			fieldId: '0'
		});
	});
});
