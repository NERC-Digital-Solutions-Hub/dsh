import {
	DatasetTreeviewNode,
	NodeDrawState,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import type { TreeviewNodeCapabilities } from '$lib/Models/Treeview/TreeviewNodeCapabilities';
import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import type { INodeProvider } from '$lib/Services/INodeProvider';
import type {
	INodeVisibilityRenderer,
	NodeVisibilityDependencyChange,
	NodeVisibilityRenderChange
} from '$lib/Services/INodeVisibilityRenderer';
import type { IVisibilityGroupProvider } from '$lib/Services/IVisibilityGroupProvider';
import { NodeVisibilityController } from '$lib/Services/NodeVisibilityController.svelte';
import {
	TreeviewNodeLayerType,
	type TreeviewNodeConfig,
	type VisibilityGroupConfig
} from '$lib/Types/Treeview.types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

type FakeNodeVisibilityRenderer = INodeVisibilityRenderer & {
	applyVisibility: Mock<(change: NodeVisibilityRenderChange) => void>;
	applyDependencyVisibility: Mock<(change: NodeVisibilityDependencyChange) => void>;
	reset: Mock<() => void>;
};

describe('NodeVisibilityController', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('defaults unknown visibility to false and hidden draw state for folders', () => {
		const { controller, nodes } = createControllerFixture();

		expect(controller.getVisibilityState(nodes.root)).toBe(false);
		expect(controller.getDrawState(nodes.root)).toBe(NodeDrawState.Hidden);
	});

	it('tracks folder visibility through the public API', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.root, true);

		expect(controller.getVisibilityState(nodes.root)).toBe(true);
		expect(controller.getDrawState(nodes.root)).toBe(NodeDrawState.Visible);
		expect(controller.visibilityStates.get(nodes.root.id)).toBe(true);
	});

	it('tracks dataset visibility without renderer draw state', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
		expect(controller.getDrawState(nodes.dataset)).toBeUndefined();
		expect(controller.drawStates.has(nodes.dataset.id)).toBe(false);
	});

	it('tracks variable visibility without renderer draw state', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.tileVariable, true);

		expect(controller.getVisibilityState(nodes.tileVariable)).toBe(true);
		expect(controller.getDrawState(nodes.tileVariable)).toBeUndefined();
		expect(controller.drawStates.has(nodes.tileVariable.id)).toBe(false);
	});

	it('keeps variable nodes as distinct model types from dataset nodes', () => {
		const { nodes } = createControllerFixture();

		expect(nodes.fieldVariable).toBeInstanceOf(VariableTreeviewNode);
		expect(nodes.fieldVariable).not.toBeInstanceOf(DatasetTreeviewNode);
		expect(nodes.tileVariable).not.toBeInstanceOf(DatasetTreeviewNode);
	});

	it('does not change observable state when setting the same dataset visibility state twice', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);
		const entriesAfterFirstSet = [...controller.visibilityStates.entries()];

		controller.setVisibilityState(nodes.dataset, true);

		expect([...controller.visibilityStates.entries()]).toEqual(entriesAfterFirstSet);
		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
	});

	it('clears visibility and draw state on reset', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(nodes.tileVariable, true);
		controller.reset();

		expect(controller.visibilityStates.size).toBe(0);
		expect(controller.drawStates.size).toBe(0);
		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
	});

	it('marks ancestors visible when a child becomes visible', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);

		expect(controller.getVisibilityState(nodes.folder)).toBe(true);
		expect(controller.getVisibilityState(nodes.root)).toBe(true);
		expect(controller.getDrawState(nodes.folder)).toBe(NodeDrawState.Visible);
		expect(controller.getDrawState(nodes.root)).toBe(NodeDrawState.Visible);
	});

	it('hides ancestors when the last visible descendant becomes hidden', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(nodes.dataset, false);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(nodes.folder)).toBe(false);
		expect(controller.getVisibilityState(nodes.root)).toBe(false);
		expect(controller.getDrawState(nodes.folder)).toBe(NodeDrawState.Hidden);
	});

	it('keeps ancestors visible while another descendant remains visible', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(nodes.tileVariable, true);
		controller.setVisibilityState(nodes.dataset, false);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(nodes.tileVariable)).toBe(true);
		expect(controller.getVisibilityState(nodes.folder)).toBe(true);
		expect(controller.getVisibilityState(nodes.root)).toBe(true);
	});

	it('hides visible descendants when a folder is hidden', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(nodes.fieldVariable, true);
		controller.setVisibilityState(nodes.folder, false);

		expect(controller.getVisibilityState(nodes.folder)).toBe(false);
		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(nodes.fieldVariable)).toBe(false);
		expect(controller.getVisibilityState(nodes.root)).toBe(false);
	});

	it('does not create visibility entries for already-hidden descendants when hiding a folder', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.folder, true);
		controller.setVisibilityState(nodes.folder, false);

		expect(controller.visibilityStates.has(nodes.dataset.id)).toBe(false);
		expect(controller.visibilityStates.has(nodes.fieldVariable.id)).toBe(false);
		expect(controller.visibilityStates.has(nodes.tileVariable.id)).toBe(false);
	});

	it('returns undefined and warns when a variable has no dataset ancestor for draw state', () => {
		const { controller } = createControllerFixture();
		const orphan = createVariable('orphan-variable', 'Orphan variable');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		expect(controller.getDrawState(orphan)).toBeUndefined();
		expect(warn).toHaveBeenCalledWith('Dataset node not found for variable node orphan-variable');
	});

	it('field variables also toggle their owning dataset visibility', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.fieldVariable, true);

		expect(controller.getVisibilityState(nodes.fieldVariable)).toBe(true);
		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
		expect(controller.getVisibilityState(nodes.folder)).toBe(true);
		expect(controller.getDrawState(nodes.fieldVariable)).toBeUndefined();
	});

	it('tile variables are tracked as node visibility without renderer assumptions', () => {
		const { controller, nodes } = createControllerFixture();

		controller.setVisibilityState(nodes.tileVariable, true);
		controller.setVisibilityState(nodes.tileVariable, false);

		expect(controller.getVisibilityState(nodes.tileVariable)).toBe(false);
		expect(controller.getVisibilityState(nodes.folder)).toBe(false);
		expect(controller.drawStates.has(nodes.tileVariable.id)).toBe(false);
	});

	it('warns for missing render capabilities while still tracking visibility', () => {
		const { controller, nodeMap, nodes } = createControllerFixture();
		const unknown = createVariable(
			'unknown-variable',
			'Unknown variable',
			{ capabilities: {} },
			nodes.dataset
		);
		nodes.dataset.children.push(unknown);
		nodeMap.set(unknown.id, unknown);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		controller.setVisibilityState(unknown, true);

		expect(warn).toHaveBeenCalledWith('Render target not found for node unknown-variable');
		expect(controller.getVisibilityState(unknown)).toBe(true);
		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
	});

	it('warns without throwing when a visibility group config is missing', () => {
		const { configs, controller, nodes } = createControllerFixture();
		configs.set(nodes.dataset.id, nodeConfig(nodes.dataset.id, { visibilityGroupId: 'missing' }));
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		controller.setVisibilityState(nodes.dataset, true);

		expect(warn).toHaveBeenCalledWith('Visibility group config not found for group ID missing');
		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
	});

	it('enforces a visibility group with maxVisibleLayers set to one', () => {
		const { configs, controller, nodeMap, nodes, visibilityGroups } = createControllerFixture();
		const second = createDataset('second-dataset', 'Second dataset', {}, nodes.folder);
		nodes.folder.children.push(second);
		nodeMap.set(second.id, second);
		configs.set(nodes.dataset.id, nodeConfig(nodes.dataset.id, { visibilityGroupId: 'group' }));
		configs.set(second.id, nodeConfig(second.id, { visibilityGroupId: 'group' }));
		visibilityGroups.set('group', { id: 'group', maxVisibleLayers: 1 });

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(second, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(second)).toBe(true);
	});

	it('evicts the oldest visible node when a visibility group limit is exceeded', () => {
		const { configs, controller, nodeMap, nodes, visibilityGroups } = createControllerFixture();
		const second = createDataset('second-dataset', 'Second dataset', {}, nodes.folder);
		const third = createDataset('third-dataset', 'Third dataset', {}, nodes.folder);
		nodes.folder.children.push(second, third);
		for (const node of [nodes.dataset, second, third]) {
			nodeMap.set(node.id, node);
			configs.set(node.id, nodeConfig(node.id, { visibilityGroupId: 'group' }));
		}
		visibilityGroups.set('group', { id: 'group', maxVisibleLayers: 2 });

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(second, true);
		controller.setVisibilityState(third, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(second)).toBe(true);
		expect(controller.getVisibilityState(third)).toBe(true);
	});

	it('removes explicitly hidden group members from active group tracking', () => {
		const { configs, controller, nodeMap, nodes, visibilityGroups } = createControllerFixture();
		const second = createDataset('second-dataset', 'Second dataset', {}, nodes.folder);
		const third = createDataset('third-dataset', 'Third dataset', {}, nodes.folder);
		nodes.folder.children.push(second, third);
		for (const node of [nodes.dataset, second, third]) {
			nodeMap.set(node.id, node);
			configs.set(node.id, nodeConfig(node.id, { visibilityGroupId: 'group' }));
		}
		visibilityGroups.set('group', { id: 'group', maxVisibleLayers: 2 });

		controller.setVisibilityState(nodes.dataset, true);
		controller.setVisibilityState(nodes.dataset, false);
		controller.setVisibilityState(second, true);
		controller.setVisibilityState(third, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(false);
		expect(controller.getVisibilityState(second)).toBe(true);
		expect(controller.getVisibilityState(third)).toBe(true);
	});

	it('leaves dependency node visibility unchanged without a renderer provider', () => {
		const { configs, controller, nodes } = createControllerFixture();
		configs.set(
			nodes.dataset.id,
			nodeConfig(nodes.dataset.id, { visibilityDependencyIds: [nodes.dependency.id] })
		);

		controller.setVisibilityState(nodes.dataset, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
		expect(controller.getVisibilityState(nodes.dependency)).toBe(false);
	});

	it('calls the renderer for dataset render targets', () => {
		const renderer = createVisibilityRenderer();
		const { controller, nodes } = createControllerFixture({ renderer });

		controller.setVisibilityState(nodes.dataset, true);

		expect(renderer.applyVisibility).toHaveBeenCalledOnce();
		expect(renderer.applyVisibility.mock.calls[0][0]).toMatchObject({
			sourceNode: nodes.dataset,
			target: {
				kind: 'source',
				nodeId: nodes.dataset.id,
				sourceId: nodes.dataset.layerId,
				drawStateNodeId: nodes.dataset.id
			},
			isVisible: true
		});
	});

	it('calls the renderer for variable render targets', () => {
		const renderer = createVisibilityRenderer();
		const { controller, nodes } = createControllerFixture({ renderer });

		controller.setVisibilityState(nodes.tileVariable, true);

		expect(renderer.applyVisibility).toHaveBeenCalledOnce();
		expect(renderer.applyVisibility.mock.calls[0][0]).toMatchObject({
			sourceNode: nodes.tileVariable,
			target: {
				kind: 'source-member',
				nodeId: nodes.tileVariable.id,
				sourceId: nodes.tileVariable.layerId,
				memberId: nodes.tileVariable.variableId,
				drawStateNodeId: nodes.tileVariable.id
			},
			isVisible: true
		});
	});

	it('resolves field variables to their owning dataset render target', () => {
		const renderer = createVisibilityRenderer();
		const { controller, nodes } = createControllerFixture({ renderer });

		controller.setVisibilityState(nodes.fieldVariable, true);

		expect(controller.getVisibilityState(nodes.dataset)).toBe(true);
		expect(renderer.applyVisibility).toHaveBeenCalledOnce();
		expect(renderer.applyVisibility.mock.calls[0][0]).toMatchObject({
			sourceNode: nodes.fieldVariable,
			target: {
				kind: 'source',
				nodeId: nodes.fieldVariable.id,
				sourceId: nodes.dataset.layerId,
				drawStateNodeId: nodes.dataset.id
			},
			isVisible: true
		});
	});

	it('updates draw states from renderer callbacks', () => {
		const renderer = createVisibilityRenderer();
		const { controller, nodes } = createControllerFixture({ renderer });

		controller.setVisibilityState(nodes.dataset, true);
		renderer.applyVisibility.mock.calls[0][0].setDrawState(NodeDrawState.Visible);

		expect(controller.getDrawState(nodes.dataset)).toBe(NodeDrawState.Visible);

		renderer.applyVisibility.mock.calls[0][0].setDrawState(undefined);

		expect(controller.getDrawState(nodes.dataset)).toBeUndefined();
	});

	it('calls renderer cleanup on reset', () => {
		const renderer = createVisibilityRenderer();
		const { controller } = createControllerFixture({ renderer });

		controller.reset();

		expect(renderer.reset).toHaveBeenCalledOnce();
	});

	it('applies renderer-side dependency visibility without changing dependency node state', () => {
		const renderer = createVisibilityRenderer();
		const { configs, controller, nodes } = createControllerFixture({ renderer });
		configs.set(
			nodes.dataset.id,
			nodeConfig(nodes.dataset.id, { visibilityDependencyIds: [nodes.dependency.id] })
		);

		controller.setVisibilityState(nodes.dataset, true);

		expect(renderer.applyDependencyVisibility).toHaveBeenCalledOnce();
		expect(renderer.applyDependencyVisibility.mock.calls[0][0]).toMatchObject({
			sourceNode: nodes.dataset,
			dependentNode: nodes.dependency,
			target: {
				kind: 'source',
				nodeId: nodes.dependency.id,
				sourceId: nodes.dependency.layerId,
				drawStateNodeId: nodes.dependency.id
			},
			isVisible: true
		});
		expect(controller.getVisibilityState(nodes.dependency)).toBe(false);
	});
});

function createControllerFixture(
	options: {
		configs?: Map<string, TreeviewNodeConfig>;
		renderer?: INodeVisibilityRenderer;
		visibilityGroups?: Map<string, VisibilityGroupConfig>;
	} = {}
) {
	const nodes = createTree();
	const nodeMap = collectNodes(nodes.root);
	const configs = options.configs ?? new Map<string, TreeviewNodeConfig>();
	const visibilityGroups = options.visibilityGroups ?? new Map<string, VisibilityGroupConfig>();
	const nodeProvider = createNodeProvider(nodeMap);
	const configProvider = createConfigProvider(configs);
	const visibilityGroupProvider = createVisibilityGroupProvider(visibilityGroups);
	const controller = new NodeVisibilityController(
		nodeProvider,
		configProvider,
		visibilityGroupProvider,
		options.renderer
	);

	return {
		configs,
		controller,
		nodeMap,
		nodes,
		visibilityGroups
	};
}

function createTree() {
	const root = createFolder('root', 'Root');
	const folder = createFolder('folder', 'Folder', root);
	const dataset = createDataset('dataset', 'Dataset', { layerId: 'dataset-layer' }, folder);
	const fieldVariable = createVariable(
		'field-variable',
		'Field variable',
		{
			capabilities: fieldVariableCapabilities('dataset-layer', 'field', dataset.id)
		},
		dataset
	);
	const tileVariable = createVariable(
		'tile-variable',
		'Tile variable',
		{
			capabilities: sourceMemberCapabilities('tile-layer', '2', 'tile-variable')
		},
		folder
	);
	const dependency = createDataset(
		'dependency',
		'Dependency',
		{ layerId: 'dependency-layer' },
		folder
	);

	root.children.push(folder);
	folder.children.push(dataset, tileVariable, dependency);
	dataset.children.push(fieldVariable);

	return { dependency, dataset, fieldVariable, folder, root, tileVariable };
}

function createFolder(id: string, name: string, parent: TreeviewNode | null = null): TreeviewNode {
	return new TreeviewNode(id, name, [], parent);
}

function createDataset(
	id: string,
	name: string,
	options: {
		layerId?: string;
		capabilities?: TreeviewNodeCapabilities;
	} = {},
	parent: TreeviewNode | null = null
): DatasetTreeviewNode {
	const layerId = options.layerId ?? `${id}-layer`;
	return new DatasetTreeviewNode(
		id,
		name,
		options.capabilities ?? datasetCapabilities(id, layerId),
		[],
		parent
	);
}

function createVariable(
	id: string,
	name: string,
	options: {
		capabilities?: TreeviewNodeCapabilities;
	} = {},
	parent: TreeviewNode | null = null
): VariableTreeviewNode {
	return new VariableTreeviewNode(id, name, options.capabilities, [], parent);
}

function datasetCapabilities(nodeId: string, sourceId: string): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source',
			sourceId,
			drawStateNodeId: nodeId
		},
		selection: {
			kind: 'dataset',
			sourceId
		}
	};
}

function fieldVariableCapabilities(
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

function sourceMemberCapabilities(
	sourceId: string,
	memberId: string,
	drawStateNodeId: string
): TreeviewNodeCapabilities {
	return {
		render: {
			kind: 'source-member',
			sourceId,
			memberId,
			drawStateNodeId
		}
	};
}

function collectNodes(root: TreeviewNode): Map<string, TreeviewNode> {
	const nodeMap = new Map<string, TreeviewNode>();
	const visit = (node: TreeviewNode) => {
		nodeMap.set(node.id, node);
		for (const child of node.children) {
			visit(child);
		}
	};

	visit(root);

	return nodeMap;
}

function createNodeProvider(nodeMap: Map<string, TreeviewNode>): INodeProvider {
	return {
		getAllTreeviewNodes: () => [...nodeMap.values()],
		getTreeviewNode: (nodeId: string) => nodeMap.get(nodeId)
	};
}

function createConfigProvider(configs: Map<string, TreeviewNodeConfig>): INodeConfigProvider {
	return {
		getConfig: (nodeId: string) => configs.get(nodeId)
	};
}

function createVisibilityGroupProvider(
	visibilityGroups: Map<string, VisibilityGroupConfig>
): IVisibilityGroupProvider {
	return {
		getVisibilityGroupConfig: (nodeId: string) => visibilityGroups.get(nodeId)
	};
}

function nodeConfig(id: string, overrides: Partial<TreeviewNodeConfig> = {}): TreeviewNodeConfig {
	return {
		id,
		type: TreeviewNodeLayerType.None,
		...overrides
	};
}

function createVisibilityRenderer(): FakeNodeVisibilityRenderer {
	return {
		applyVisibility: vi.fn(),
		applyDependencyVisibility: vi.fn(),
		reset: vi.fn()
	} as FakeNodeVisibilityRenderer;
}
