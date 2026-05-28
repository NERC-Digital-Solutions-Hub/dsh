import {
	DatasetTreeviewNode,
	SelectionState,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import type { TreeviewNodeCapabilities } from '$lib/Models/Treeview/TreeviewNodeCapabilities';
import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import { NodeSelectionController } from '$lib/Services/NodeSelectionController';
import { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
import { TreeviewNodeLayerType, type TreeviewNodeConfig } from '$lib/Types/Treeview.types';
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

function createConfigProvider(configs: Map<string, TreeviewNodeConfig>): INodeConfigProvider {
	return {
		getConfig: (nodeId: string) => configs.get(nodeId)
	};
}

function nodeConfig(id: string): TreeviewNodeConfig {
	return {
		id,
		type: TreeviewNodeLayerType.None
	};
}
