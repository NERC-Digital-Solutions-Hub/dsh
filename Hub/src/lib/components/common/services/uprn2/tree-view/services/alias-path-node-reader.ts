import { CustomNodeConverter } from '$lib/components/common/services/uprn2/tree-view/services/custom-node-reader';
import {
	TreeFieldNode,
	TreeLayerNode,
	TreeNode
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

		// Split alias like "A | B | C" -> ["A","B","C"]
		const pathNodes =
			field.alias
				?.split('|')
				.map((s) => s.trim())
				.filter(Boolean) ?? [];

		// Start attaching under explicit parentNode (if provided) or the layer node
		let currentParent: TreeNode = parentNode ?? parentLayerNode;
		let lastPathNode: TreeNode | undefined;

		// Helper to safely append a child once
		const attachChild = (parent: TreeNode, child: TreeNode) => {
			parent.children ??= [];
			if (!parent.children.includes(child)) parent.children.push(child);
		};

		for (let i = 0; i < pathNodes.length; i++) {
			const label = pathNodes[i];

			// Build a stable key for this level (layerId + cumulative path)
			const cumulative = pathNodes.slice(0, i + 1).join('::');
			const key = `${parentLayerNode.id}::${cumulative}`;

			// Reuse if already created; otherwise create and attach
			let node = nodePathMap.get(key);
			if (!node) {
				node = new TreeNode(
					key, // id
					label, // label/name
					[], // children
					currentParent // parent
				);
				nodePathMap.set(key, node);
				attachChild(currentParent, node);
			} else if (node.parent !== currentParent) {
				// In case a reused node needs its parent set (defensive)
				node.parent = currentParent;
				attachChild(currentParent, node);
			}

			currentParent = node;
			lastPathNode = node;
		}

		// If we created path nodes, the field lives under the deepest one
		const fieldParent = lastPathNode ?? parentNode ?? parentLayerNode;

		const fieldNode = new TreeFieldNode(
			fieldNodeId,
			field.alias || field.name,
			parentLayerNode.layer as __esri.FeatureLayer,
			field,
			[],
			fieldParent
		);

		// Attach the field node as a child of its parent (avoid duplicates)
		fieldParent.children ??= [];
		if (!fieldParent.children.includes(fieldNode)) {
			fieldParent.children.push(fieldNode);
		}

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
