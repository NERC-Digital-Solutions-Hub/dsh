import {
	DatasetTreeviewNode,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import { LayerType } from '$lib/Models/Treeview/LayerType';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import { VariableSubType } from '$lib/Models/Treeview/VariableSubType';
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
	parent: TreeviewNode | null = null
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
				config.children?.map((childConfig) => createNodeFromConfig(childConfig, folderNode)) || [];
			folderNode.children.push(...childNodes);

			return folderNode;
		}
		case TreeviewNodeTypology.DatasetRaster:
		case TreeviewNodeTypology.DatasetVector: {
			const datasetNode = new DatasetTreeviewNode(
				config.id,
				config.displayName || config.name || config.id,
				config.layerId || '',
				config.typology === TreeviewNodeTypology.DatasetRaster ? LayerType.Tile : LayerType.Feature,
				[],
				parent
			);

			const childNodes =
				config.children?.map((childConfig) => createNodeFromConfig(childConfig, datasetNode)) || [];
			datasetNode.children.push(...childNodes);

			return datasetNode;
		}
		case TreeviewNodeTypology.Variable:
			return new VariableTreeviewNode(
				config.id,
				config.displayName || config.name || config.id,
				config.layerId || '',
				parent && isDatasetNode(parent) ? parent.layerType : LayerType.Feature,
				parent && isDatasetNode(parent) && parent.layerType === LayerType.Tile
					? VariableSubType.Tile
					: VariableSubType.Field,
				config.variableId || '',
				[],
				parent
			);
		default:
			throw new Error(`Unsupported node typology: ${config.typology}`);
	}
}

/**
 * Checks if a given node is a folder TreeviewNode.
 * @param node The node to check.
 * @returns True if the node is a folder TreeviewNode, false otherwise.
 */
function isFolderNode(node: TreeviewNode): node is TreeviewNode {
	return node.type === TreeviewNodeType.Folder;
}

/**
 * Checks if a given node is a DatasetTreeviewNode.
 * @param node The node to check.
 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
 */
function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
	return node.type === TreeviewNodeType.Dataset;
}

/**
 * Checks if a given node is a VariableTreeviewNode.
 * @param node The node to check.
 * @returns True if the node is a VariableTreeviewNode, false otherwise.
 */
function isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
	return node.type === TreeviewNodeType.Variable;
}
