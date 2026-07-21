import {
	DatasetTreeviewNode,
	SelectionState,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/models/treeview/index';
import type { TreeviewNodeCapabilities } from '$lib/models/treeview/treeview-node-capabilities';
import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
import { NodeSelectionController } from '$lib/services/node-selection-controller';
import { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
import { TreeviewNodeLayerType, type TreeviewNodeConfig } from '$lib/types/treeview.types';
import { describe, expect, it } from 'vitest';

describe('NodeSelectionController', () => {
	it('selects field variables through field selection capabilities', () => {
		const { controller, dataSelectionStore, nodes } = createSelectionFixture();

		controller.setSelectionState(nodes.fieldVariable, SelectionState.Active);

		const selection = dataSelectionStore.getSelection('dataset-source');
		expect(selection?.selectedFieldIds.has('field')).toBe(true);
		expect(controller.getSelectionState(nodes.fieldVariable)).toBe(SelectionState.Active);
	});

	it('selects leaf datasets through dataset selection capabilities', () => {
		const { controller, dataSelectionStore, nodes } = createSelectionFixture();

		controller.setSelectionState(nodes.leafDataset, SelectionState.Active);

		expect(dataSelectionStore.getSelection('leaf-source')).toBeDefined();
		expect(controller.getSelectionState(nodes.leafDataset)).toBe(SelectionState.Active);
	});

	it('does not select source-member render variables without selection capabilities', () => {
		const { controller, dataSelectionStore, nodes } = createSelectionFixture();

		controller.setSelectionState(nodes.memberVariable, SelectionState.Active);

		expect(dataSelectionStore.getAllSelections()).toHaveLength(0);
		expect(controller.getSelectionState(nodes.memberVariable)).toBe(SelectionState.Inactive);
	});

	it('derives parent state from field selection capabilities instead of layer type', () => {
		const { controller, nodes } = createSelectionFixture();

		controller.setSelectionState(nodes.fieldVariable, SelectionState.Active);

		expect(controller.getSelectionState(nodes.dataset)).toBe(SelectionState.Indeterminate);
		expect(controller.getSelectionState(nodes.root)).toBe(SelectionState.Indeterminate);
	});

	it('treats a partially selected field-capable dataset as selected for its direct parent', () => {
		const { controller, nodes } = createSelectionFixture({ includeOnlyFieldDataset: true });

		controller.setSelectionState(nodes.fieldVariable, SelectionState.Active);

		expect(controller.getSelectionState(nodes.dataset)).toBe(SelectionState.Indeterminate);
		expect(controller.getSelectionState(nodes.root)).toBe(SelectionState.Active);
	});

	it('selects raster source-member variables through field selection capabilities', () => {
		const root = new TreeviewNode('root', 'Root');
		const rasterDataset = createDataset(
			'raster-dataset',
			'Raster Dataset',
			datasetCapabilities('raster-source'),
			root
		);
		const rasterVariable = createVariable(
			'raster-dataset-0',
			'Raster member 0',
			selectableSourceMemberCapabilities('raster-source', '0'),
			rasterDataset
		);
		rasterDataset.children.push(rasterVariable);
		root.children.push(rasterDataset);
		const { controller, dataSelectionStore } = createControllerForRoot(root);

		controller.setSelectionState(rasterVariable, SelectionState.Active);

		const selection = dataSelectionStore.getSelection('raster-source');
		expect(selection?.selectedFieldIds.has('0')).toBe(true);
		expect(controller.getSelectionState(rasterVariable)).toBe(SelectionState.Active);
		expect(controller.getSelectionState(rasterDataset)).toBe(SelectionState.Active);
	});

	it('selects visible raster source members from a raster parent and ignores hidden children', () => {
		const root = new TreeviewNode('root', 'Root');
		const rasterDataset = createDataset(
			'raster-dataset',
			'Raster Dataset',
			datasetCapabilities('raster-source'),
			root
		);
		const firstRasterVariable = createVariable(
			'raster-dataset-0',
			'Raster member 0',
			selectableSourceMemberCapabilities('raster-source', '0'),
			rasterDataset
		);
		const secondRasterVariable = createVariable(
			'raster-dataset-1',
			'Raster member 1',
			selectableSourceMemberCapabilities('raster-source', '1'),
			rasterDataset
		);
		const hiddenRasterVariable = createVariable(
			'raster-dataset-hidden',
			'Hidden raster member',
			selectableSourceMemberCapabilities('raster-source', 'hidden'),
			rasterDataset
		);
		rasterDataset.children.push(firstRasterVariable, secondRasterVariable, hiddenRasterVariable);
		root.children.push(rasterDataset);
		const { controller, dataSelectionStore } = createControllerForRoot(root, {
			'raster-dataset-hidden': { isHidden: true }
		});

		controller.setSelectionState(rasterDataset, SelectionState.Active);

		const selection = dataSelectionStore.getSelection('raster-source');
		expect(selection?.selectedFieldIds).toEqual(new Set(['0', '1']));
		expect(controller.getSelectionState(rasterDataset)).toBe(SelectionState.Active);

		controller.setSelectionState(rasterDataset, SelectionState.Inactive);

		expect(dataSelectionStore.getSelection('raster-source')).toBeUndefined();
		expect(controller.getSelectionState(rasterDataset)).toBe(SelectionState.Inactive);
	});

	it('selects vector datasets with only hidden children as whole-layer selections', () => {
		const root = new TreeviewNode('root', 'Root');
		const vectorDataset = createDataset(
			'vector-dataset',
			'Vector Dataset',
			datasetCapabilities('vector-source'),
			root
		);
		const hiddenFieldVariable = createVariable(
			'vector-dataset-objectid',
			'OBJECTID',
			fieldCapabilities('vector-source', 'objectid', vectorDataset.id),
			vectorDataset
		);
		vectorDataset.children.push(hiddenFieldVariable);
		root.children.push(vectorDataset);
		const { controller, dataSelectionStore } = createControllerForRoot(root, {
			'vector-dataset-objectid': { isHidden: true }
		});

		controller.setSelectionState(vectorDataset, SelectionState.Active);

		const selection = dataSelectionStore.getSelection('vector-source');
		expect(selection).toBeDefined();
		expect(selection?.selectedFieldIds.size).toBe(0);
		expect(controller.getSelectionState(vectorDataset)).toBe(SelectionState.Active);

		controller.setSelectionState(vectorDataset, SelectionState.Inactive);

		expect(dataSelectionStore.getSelection('vector-source')).toBeUndefined();
		expect(controller.getSelectionState(vectorDataset)).toBe(SelectionState.Inactive);
	});
});

function createSelectionFixture(options: { includeOnlyFieldDataset?: boolean } = {}) {
	const root = new TreeviewNode('root', 'Root');
	const dataset = createDataset('dataset', 'Dataset', datasetCapabilities('dataset-source'), root);
	const fieldVariable = createVariable(
		'field-variable',
		'Field variable',
		fieldCapabilities('dataset-source', 'field', dataset.id),
		dataset
	);
	const secondFieldVariable = createVariable(
		'second-field-variable',
		'Second field variable',
		fieldCapabilities('dataset-source', 'second-field', dataset.id),
		dataset
	);
	dataset.children.push(fieldVariable, secondFieldVariable);
	root.children.push(dataset);

	const memberVariable = createVariable(
		'member-variable',
		'Member variable',
		sourceMemberCapabilities('member-source', '2'),
		root
	);
	const leafDataset = createDataset(
		'leaf-dataset',
		'Leaf dataset',
		datasetCapabilities('leaf-source'),
		root
	);

	if (!options.includeOnlyFieldDataset) {
		root.children.push(memberVariable, leafDataset);
	}

	const dataSelectionStore = new DataSelectionStore();
	const controller = new NodeSelectionController(
		dataSelectionStore,
		createConfigProvider(new Map(root.children.map((node) => [node.id, nodeConfig(node.id)])))
	);

	return {
		controller,
		dataSelectionStore,
		nodes: {
			dataset,
			fieldVariable,
			leafDataset,
			memberVariable,
			root,
			secondFieldVariable
		}
	};
}

function createDataset(
	id: string,
	name: string,
	capabilities: TreeviewNodeCapabilities,
	parent: TreeviewNode | null
): DatasetTreeviewNode {
	return new DatasetTreeviewNode(id, name, capabilities, [], parent);
}

function createVariable(
	id: string,
	name: string,
	capabilities: TreeviewNodeCapabilities,
	parent: TreeviewNode | null
): VariableTreeviewNode {
	return new VariableTreeviewNode(id, name, capabilities, [], parent);
}

function datasetCapabilities(sourceId: string): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source',
			sourceId
		},
		selection: {
			kind: 'dataset',
			sourceId
		}
	};
}

function fieldCapabilities(
	sourceId: string,
	fieldId: string,
	drawStateNodeId: string
): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source',
			sourceId,
			drawStateNodeId
		},
		selection: {
			kind: 'field',
			sourceId,
			fieldId
		},
		style: {
			kind: 'field',
			sourceId,
			fieldId
		}
	};
}

function sourceMemberCapabilities(sourceId: string, memberId: string): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source-member',
			sourceId,
			memberId
		}
	};
}

function selectableSourceMemberCapabilities(
	sourceId: string,
	memberId: string
): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source-member',
			sourceId,
			memberId
		},
		selection: {
			kind: 'field',
			sourceId,
			fieldId: memberId
		}
	};
}

function createControllerForRoot(
	root: TreeviewNode,
	configOverrides: Record<string, Partial<TreeviewNodeConfig>> = {}
) {
	const dataSelectionStore = new DataSelectionStore();
	const controller = new NodeSelectionController(
		dataSelectionStore,
		createConfigProvider(createConfigMap(root, configOverrides))
	);

	return { controller, dataSelectionStore };
}

function createConfigMap(
	root: TreeviewNode,
	configOverrides: Record<string, Partial<TreeviewNodeConfig>>
): Map<string, TreeviewNodeConfig> {
	const configs = new Map<string, TreeviewNodeConfig>();
	const walk = (node: TreeviewNode) => {
		configs.set(node.id, nodeConfig(node.id, configOverrides[node.id]));
		for (const child of node.children) {
			walk(child);
		}
	};

	walk(root);
	return configs;
}

function createConfigProvider(configs: Map<string, TreeviewNodeConfig>): INodeConfigProvider {
	return {
		getConfig: (nodeId: string) => configs.get(nodeId)
	};
}

function nodeConfig(id: string, overrides: Partial<TreeviewNodeConfig> = {}): TreeviewNodeConfig {
	return {
		id,
		type: TreeviewNodeLayerType.None,
		...overrides
	};
}
