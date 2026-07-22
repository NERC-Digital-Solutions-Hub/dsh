import { createTreeviewRuntime } from '$lib/services/create-treeview-runtime';
import { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
import {
	TreeviewNodeLayerType,
	TreeviewNodeTypology,
	TreeviewType,
	type TreeviewConfig
} from '$lib/types/treeview.types';
import { describe, expect, it } from 'vitest';

describe('createTreeviewRuntime', () => {
	it('builds separate area and data adapters over one canonical node graph', () => {
		const config: TreeviewConfig = {
			layers: [
				{
					id: 'areas',
					type: TreeviewNodeLayerType.FeatureLayer,
					treeviewType: TreeviewType.Area,
					typology: TreeviewNodeTypology.DatasetVector,
					children: []
				},
				{
					id: 'data',
					type: TreeviewNodeLayerType.FeatureLayer,
					treeviewType: TreeviewType.Data,
					typology: TreeviewNodeTypology.DatasetVector,
					children: []
				},
				{
					id: 'hidden',
					type: TreeviewNodeLayerType.FeatureLayer,
					treeviewType: TreeviewType.Data,
					typology: TreeviewNodeTypology.DatasetVector,
					isHidden: true,
					children: []
				}
			]
		};
		const runtime = createTreeviewRuntime(config, new DataSelectionStore());

		expect(runtime.nodes.map((node) => node.id)).toEqual(['areas', 'data', 'hidden']);
		expect(runtime.areaNodes.map((node) => node.id)).toEqual(['areas']);
		expect(runtime.dataNodes.map((node) => node.id)).toEqual(['data']);
		expect(runtime.nodeProvider.getTreeviewNode('areas')).toBe(runtime.nodes[0]);
	});
});
