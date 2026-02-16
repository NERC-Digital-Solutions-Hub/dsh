import { CustomNodeConverter } from '$lib/components/tree-view/services/custom-node-converter';
import { VariableTreeviewNode, LayerTreeviewNode, TreeviewNode } from '$lib/models/treeview';
import {
	TreeviewNodeType,
	TreeviewNodeTypology,
	type TreeviewNodeConfig
} from '$lib/types/treeview';
import { decodeHtmlEntities } from '$lib/utils/decode-html';

/**
 * Node converter that handles field alias paths for feature layers.
 * Converts field aliases like "A | B | C" into hierarchical tree nodes.
 */
export class AliasPathNodeConverter extends CustomNodeConverter {
	/** @inheritdoc */
	public readonly id = 'aliasPath';

	/** @inheritdoc */
	public layerToNode(layer: __esri.Layer, parent: TreeviewNode | null): TreeviewNode {
		const node = new LayerTreeviewNode(layer.id, layer.title as string, layer, [], parent);
		const nodeConfig: TreeviewNodeConfig | undefined = this.configStore.getConfig(layer.id);

		if (this.#isFeatureLayer(layer) && nodeConfig?.showFields) {
			const featureLayer = layer as __esri.FeatureLayer;
			if (!featureLayer.loaded) {
				console.warn(`Layer not loaded: ${layer.id}`);
			}

			const nodePathMap: Map<string, TreeviewNode> = new Map();
			for (const field of featureLayer.fields ?? []) {
				const fieldConfig = this.configStore.getConfig(this.#getFieldNodeId(layer.id, field.name));
				if (!fieldConfig || fieldConfig.isHidden) {
					continue;
				}

				this.#fieldToNode(field, node, nodePathMap);
			}

			// Sort children. if they have children, they should come first
			node.children.sort((a, b) => {
				if (a.children.length > 0 && b.children.length === 0) {
					return 1;
				} else if (a.children.length === 0 && b.children.length > 0) {
					return -1;
				}

				return 0;
			});
		}

		return node;
	}

	/**
	 * Converts a field into tree nodes based on its alias path.
	 * Handles hierarchical paths separated by '|'.
	 * @param field - The ESRI field to convert.
	 * @param parentLayerNode - The parent layer node.
	 * @param nodePathMap - Map to track created path nodes.
	 * @returns The created field node.
	 */
	#fieldToNode(
		field: __esri.Field,
		parentLayerNode: LayerTreeviewNode,
		nodePathMap: Map<string, TreeviewNode> = new Map()
	): VariableTreeviewNode {
		const fieldNodeId: string = this.#getFieldNodeId(parentLayerNode.id, field.name);

		// Split alias like "A | B | C" -> ["A","B","C"]
		const decodedAlias = decodeHtmlEntities(field.alias || '');
		const pathNodes =
			decodedAlias
				?.split('|')
				.map((s) => s.trim())
				.filter(Boolean) ?? [];

		// If no alias path, just attach the field directly under the layer
		if (pathNodes.length === 0) {
			const fieldNode = new VariableTreeviewNode(
				fieldNodeId,
				field.alias || field.name,
				parentLayerNode.layer as __esri.FeatureLayer,
				field,
				[],
				parentLayerNode
			);
			parentLayerNode.children.push(fieldNode);
			return fieldNode;
		}

		// All but the last element are "folder" nodes
		const parentPathParts = pathNodes.slice(0, -1);
		const fieldLabel = pathNodes[pathNodes.length - 1];

		let currentParent: TreeviewNode = parentLayerNode;

		// Helper to add a child safely
		const attachChild = (parent: TreeviewNode, child: TreeviewNode) => {
			parent.children ??= [];
			if (!parent.children.includes(child)) parent.children.push(child);
		};

		// Build / reuse intermediate path nodes
		for (let i = 0; i < parentPathParts.length; i++) {
			const label = parentPathParts[i];
			const cumulativeKey = pathNodes.slice(0, i + 1).join('::');
			const key = `${parentLayerNode.id}::${cumulativeKey}`;

			let node = nodePathMap.get(key);
			if (!node) {
				node = new TreeviewNode(key, label, [], currentParent);
				this.configStore.addItemConfig({
					id: key,
					name: label,
					type: TreeviewNodeType.GroupLayer,
					typology: TreeviewNodeTypology.Folder
				});
				nodePathMap.set(key, node);
				attachChild(currentParent, node);
			}

			currentParent = node;
		}

		// Create the field node under the final parent
		const fieldNode = new VariableTreeviewNode(
			fieldNodeId,
			fieldLabel || field.name, // last part of alias is the field node label
			parentLayerNode.layer as __esri.FeatureLayer,
			field,
			[],
			currentParent
		);

		attachChild(currentParent, fieldNode);
		return fieldNode;
	}

	/**
	 * Generates a unique ID for a field node.
	 * @param layerId - The layer ID.
	 * @param fieldName - The field name.
	 * @returns The field node ID.
	 */
	#getFieldNodeId(layerId: string, fieldName: string): string {
		return `${layerId}-${fieldName}`;
	}

	/**
	 * Determines if a layer is a feature layer that can contain fields.
	 * @param layer - The layer to check
	 * @returns True if the layer is a feature layer
	 */
	#isFeatureLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'feature';
	}
}
