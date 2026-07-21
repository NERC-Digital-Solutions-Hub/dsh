import {
	DatasetTreeviewNode,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/index';
import type { TreeviewNodeCapabilities } from '$lib/Models/Treeview/TreeviewNodeCapabilities';
import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/Types/Treeview.types';

/**
 * Creates treeview nodes based on the provided configurations.
 * @param configs An array of the **ROOT** TreeviewNodeConfig objects to create nodes from.
 * @returns An array of the **ROOT** TreeviewNode instances created from the configurations.
 */
export function createTreeviewNodes(configs: TreeviewNodeConfig[]): TreeviewNode[] {
	return configs.map((config) => createNodeFromConfig(config));
}

/**
 * Creates a treeview node (and its children recursively) based on the provided configuration.
 * @param config The config to create the node from.
 * @param parent The parent node.
 * @returns A node created using the config.
 */
function createNodeFromConfig(
	config: TreeviewNodeConfig,
	parent: TreeviewNode | null = null,
	parentConfig: TreeviewNodeConfig | null = null
): TreeviewNode {
	switch (config.typology) {
		case TreeviewNodeTypology.Folder: {
			const folderNode = new TreeviewNode(
				config.id,
				config.displayName || config.name || config.id,
				[],
				parent
			);

			const childNodes =
				config.children?.map((childConfig) =>
					createNodeFromConfig(childConfig, folderNode, config)
				) || [];
			folderNode.children.push(...childNodes);

			return folderNode;
		}
		case TreeviewNodeTypology.DatasetRaster:
		case TreeviewNodeTypology.DatasetVector: {
			const datasetNode = new DatasetTreeviewNode(
				config.id,
				config.displayName || config.name || config.id,
				createDatasetCapabilities(config),
				[],
				parent
			);

			const childNodes =
				config.children?.map((childConfig) =>
					createNodeFromConfig(childConfig, datasetNode, config)
				) || [];
			datasetNode.children.push(...childNodes);

			return datasetNode;
		}
		case TreeviewNodeTypology.Variable:
			return new VariableTreeviewNode(
				config.id,
				config.displayName || config.name || config.id,
				createVariableCapabilities(config, parent, parentConfig),
				[],
				parent
			);
		default:
			throw new Error(`Unsupported node typology: ${config.typology}`);
	}
}

function createDatasetCapabilities(config: TreeviewNodeConfig): TreeviewNodeCapabilities {
	const sourceId = config.layerId || config.id;
	return {
		render: {
			kind: 'source',
			sourceId,
			drawStateNodeId: config.id
		},
		selection: {
			kind: 'dataset',
			sourceId
		}
	};
}

function createVariableCapabilities(
	config: TreeviewNodeConfig,
	parent: TreeviewNode | null,
	parentConfig: TreeviewNodeConfig | null
): TreeviewNodeCapabilities {
	const parentSourceId = parent?.capabilities.render?.sourceId;
	const sourceId = config.layerId || parentSourceId || config.id;
	const memberOrFieldId = config.variableId || config.id;

	if (parentConfig?.typology === TreeviewNodeTypology.DatasetRaster) {
		return {
			render: {
				kind: 'source-member',
				sourceId,
				memberId: memberOrFieldId,
				drawStateNodeId: config.id
			},
			selection: {
				kind: 'field',
				sourceId,
				fieldId: memberOrFieldId
			}
		};
	}

	return {
		render: {
			kind: 'source',
			sourceId,
			drawStateNodeId: parent?.id
		},
		selection: {
			kind: 'field',
			sourceId,
			fieldId: memberOrFieldId
		},
		style: {
			kind: 'field',
			sourceId,
			fieldId: memberOrFieldId
		}
	};
}
