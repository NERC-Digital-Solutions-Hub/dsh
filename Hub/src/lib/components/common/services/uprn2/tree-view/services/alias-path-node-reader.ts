import { CustomNodeConverter } from '$lib/components/common/services/uprn2/tree-view/services/custom-node-reader';
import {
	TreeFieldNode,
	TreeLayerNode,
	type TreeNode
} from '$lib/components/common/services/uprn2/tree-view/types';
import type { TreeviewNodeConfig } from '$lib/types/treeview';

export class AliasPathNodeConverter extends CustomNodeConverter {
	/**
	 * @inheritdoc
	 */
	layerToNode(layer: __esri.Layer, parent: TreeNode | null): TreeNode {
		const node = new TreeLayerNode(layer.id, layer.title as string, layer, [], parent);
		const nodeConfig: TreeviewNodeConfig | undefined = this.configStore.getItemConfig(layer.id);

		if (this.#isFeatureLayer(layer) && nodeConfig?.showFields) {
			const featureLayer = layer as __esri.FeatureLayer;
			if (!featureLayer.loaded) {
				console.warn(`Layer not loaded: ${layer.id}`);
			}

			for (const field of featureLayer.fields ?? []) {
				const fieldNode = this.#fieldToNode(field, node);
				node.children.push(fieldNode);
			}
		}

		return node;
	}

	#fieldToNode(
		field: __esri.Field,
		parentLayerNode: TreeLayerNode,
		parentNode?: TreeNode,
		nodePathMap: Map<string, TreeNode> = new Map()
	): TreeFieldNode {
		const fieldNodeId: string = this.#getFieldNodeId(parentLayerNode.id, field.name);

		const fieldNode = new TreeFieldNode(
			fieldNodeId,
			field.alias || field.name,
			parentLayerNode.layer as __esri.FeatureLayer,
			field,
			[],
			parentNode ?? parentLayerNode
		);

		return fieldNode;
	}

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
