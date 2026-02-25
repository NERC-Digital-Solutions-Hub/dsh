import {
	DatasetTreeviewNode,
	NodeDrawState,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import { VariableSubType } from '$lib/Models/Treeview/VariableSubType';
import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import type { INodeProvider } from '$lib/Services/INodeProvider';
import type { INodeVisibilityController } from '$lib/Services/INodeVisibilityController';
import type { IVisibilityGroupProvider } from '$lib/Services/IVisibilityGroupProvider';
import type { LayerViewProvider } from '$lib/Services/LayerViewProvider';
import type { TreeviewNodeConfig, VisibilityGroupConfig } from '$lib/Types/treeview';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Represents a service that provides the current node visibility state. This is responsible
 * for syncing the visibility state of treeview nodes with the visibility of their associated layer
 * views in the ArcGIS API.
 */
export class NodeVisibilityController implements INodeVisibilityController {
	/** @inheritdoc */
	public readonly drawStates: Map<string, NodeDrawState> = $state(new SvelteMap());

	/** @inheritdoc */
	public readonly visibilityStates: Map<string, boolean> = $state(new SvelteMap());

	/** The layer view provider to use for accessing layer views. */
	readonly #layerViewProvider: LayerViewProvider;

	/** The node provider to use for accessing treeview nodes. */
	readonly #nodeProvider: INodeProvider;

	/** The node config provider to use for accessing node configuration such as visibility groups. */
	readonly #nodeConfigProvider: INodeConfigProvider;

	/** The visibility group provider to use for managing visibility groups. */
	readonly #visibilityGroupProvider: IVisibilityGroupProvider;

	/** Map of draw state handles for each node. The key is the node ID. */
	readonly #drawStateHandles: Map<string, IHandle> = new SvelteMap();

	/** Map of active node in each visibility group to enforce single active visibility per group. */
	readonly #activeInVisibilityGroup: Map<string, string[]> = new SvelteMap();

	/**
	 * Initializes an instance of NodeVisibilityController.
	 * @param layerViewProvider The layer view provider to use for accessing layer views.
	 * @param nodeProvider The node provider to use for accessing treeview nodes.
	 * @param nodeConfigProvider The node config provider to use for accessing node configuration such as visibility groups.
	 * @param visibilityGroupProvider The visibility group provider to use for managing visibility groups.
	 */
	constructor(
		layerViewProvider: LayerViewProvider,
		nodeProvider: INodeProvider,
		nodeConfigProvider: INodeConfigProvider,
		visibilityGroupProvider: IVisibilityGroupProvider
	) {
		this.#layerViewProvider = layerViewProvider;
		this.#nodeProvider = nodeProvider;
		this.#nodeConfigProvider = nodeConfigProvider;
		this.#visibilityGroupProvider = visibilityGroupProvider;
	}

	/**
	 * Gets the current visibility state of a given treeview node.
	 * @param node The treeview node to get the visibility state for.
	 * @returns The current visibility state of the node, or undefined if not tracked.
	 */
	public getDrawState(node: TreeviewNode): NodeDrawState | undefined {
		if (this.isDatasetNode(node)) {
			return this.drawStates.get(node.id);
		}

		if (this.isVariableNode(node)) {
			const datasetNode: DatasetTreeviewNode | null = this.getDatasetNodeForVariable(node);
			if (!datasetNode) {
				console.warn(`Dataset node not found for variable node ${node.id}`);
				return undefined;
			}

			return this.drawStates.get(datasetNode.id);
		}

		const visibilityState = this.visibilityStates.get(node.id);
		if (visibilityState) {
			return NodeDrawState.Visible;
		}

		return this.anyDescendantNodeVisible(node) ? NodeDrawState.Visible : NodeDrawState.Hidden;
	}

	/** @inheritdoc */
	public getVisibilityState(node: TreeviewNode): boolean {
		return this.visibilityStates.get(node.id) ?? false;
	}

	/** @inheritdoc */
	public setVisibilityState(node: TreeviewNode, isVisible: boolean): void {
		if (this.isDatasetNode(node)) {
			this.setDatasetVisibilityState(node, isVisible);
		} else if (this.isVariableNode(node)) {
			this.setVariableVisibilityState(node, isVisible);
		} else {
			this.setFolderVisibilityState(node, isVisible);
		}
	}

	/** @inheritdoc */
	public reset(): void {
		this.drawStates.clear();
		this.visibilityStates.clear();
		this.#activeInVisibilityGroup.clear();
		this.#drawStateHandles.forEach((handle) => handle.remove());
		this.#drawStateHandles.clear();
	}

	/**
	 * Sets the visibility state of a dataset node.
	 * @param node The dataset treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private setDatasetVisibilityState(node: DatasetTreeviewNode, isVisible: boolean): void {
		if (this.isVariableNode(node)) {
			console.warn(`Node ${node.id} is a variable node, expected dataset node.`);
			return;
		}

		const isCurrentlyVisible = this.visibilityStates.get(node.id);
		if (isCurrentlyVisible !== undefined && isVisible === isCurrentlyVisible) {
			return; // no change, do nothing
		}

		this.visibilityStates.set(node.id, isVisible);
		if (!isVisible) {
			this.hideChildNodes(node);
		}

		this.updateDependencyVisibility(node, isVisible);
		this.updateVisibilityGroup(node, isVisible);
		this.updateParentNodeVisibility(node, isVisible);

		this.setDatasetDrawState(node, isVisible);
	}

	/**
	 * Sets the draw state of a dataset node by updating the visibility of its associated layer view.
	 * @param node The dataset treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private async setDatasetDrawState(node: DatasetTreeviewNode, isVisible: boolean): Promise<void> {
		const datasetDrawState: NodeDrawState | undefined = this.drawStates.get(node.id);
		if (!isVisible && datasetDrawState === NodeDrawState.Hidden) {
			return; // already hidden, no need to update
		}

		const layerView: __esri.LayerView | undefined = await this.#layerViewProvider.getLayerViewById(
			node.layerId
		);

		if (!layerView) {
			console.warn(`Layer view not found for node ${node.id} with layer ID ${node.layerId}`);
			return;
		}

		if (!isVisible) {
			layerView.visible = false;
			this.updateParentLayerVisibility(layerView.layer, false);

			this.drawStates.delete(node.id);
			this.#drawStateHandles.get(node.id)?.remove();
			this.#drawStateHandles.delete(node.id);
			return; // don't subscribe if not visible
		}

		layerView.visible = true;
		this.setInitialDrawState(node, layerView);
		this.updateParentLayerVisibility(layerView.layer, true);

		const reactiveUtils = await import('@arcgis/core/core/reactiveUtils.js');
		const handle: IHandle = reactiveUtils.watch(
			() => layerView.suspended,
			(isSuspended, wasSuspended) => {
				if (wasSuspended && !isSuspended) {
					// entered scale range or otherwise unsuspended
					this.drawStates.set(node.id, NodeDrawState.Visible);
				} else if (!wasSuspended && isSuspended) {
					// exited scale range or otherwise suspended
					this.drawStates.set(node.id, NodeDrawState.Suspended);
				}
			}
		);

		this.#drawStateHandles.set(node.id, handle);
	}

	/**
	 * Hides all child nodes of a given node by setting their visibility state to false.
	 * @param node The parent treeview node.
	 */
	private hideChildNodes(node: TreeviewNode): void {
		if (!node.children?.length) {
			return;
		}

		for (const child of node.children) {
			if (this.getVisibilityState(child)) {
				this.setVisibilityState(child, false);
			}
		}
	}

	/**
	 * Gets the visibility group owner of a node.
	 * @param node The node to get the owner of.
	 * @returns The visibility group owner node.
	 */
	private getVisibilityGroupOwner(node: TreeviewNode): TreeviewNode {
		if (this.isVariableNode(node)) {
			if (node.variableSubType === VariableSubType.Field) {
				const datasetNode = this.getDatasetNodeForVariable(node);
				return datasetNode ?? node;
			}

			return node;
		}

		if (this.isDatasetNode(node)) {
			return node;
		}
		return node;
	}

	/**
	 * Update the visibility of nodes in the same visibility group.
	 * @param node The node to add to its visibility group.
	 * @param isVisible The new visibility state.
	 */
	private updateVisibilityGroup(node: TreeviewNode, isVisible: boolean): void {
		const ownerNode = this.getVisibilityGroupOwner(node);
		const config: TreeviewNodeConfig | undefined = this.#nodeConfigProvider.getConfig(ownerNode.id);
		if (!config?.visibilityGroupId) {
			return;
		}

		const visibilityGroupId = config.visibilityGroupId;
		let activeNodes: string[] | undefined = this.#activeInVisibilityGroup.get(visibilityGroupId);
		if (!activeNodes) {
			activeNodes = [];
			this.#activeInVisibilityGroup.set(visibilityGroupId, activeNodes);
		}

		if (!isVisible) {
			const index = activeNodes.indexOf(ownerNode.id);
			if (index === -1) {
				// console.warn(
				// 	`Node ${node.id} is being set to not visible but is not in the active nodes for its visibility group ${visibilityGroupId}`
				// );
				return;
			}

			activeNodes.splice(index, 1);
			return;
		}

		const visibilityGroupConfig: VisibilityGroupConfig | undefined =
			this.#visibilityGroupProvider.getVisibilityGroupConfig(visibilityGroupId);
		if (!visibilityGroupConfig) {
			console.warn(`Visibility group config not found for group ID ${visibilityGroupId}`);
			return;
		}

		const hideId = (id: string) => {
			const node = this.#nodeProvider.getTreeviewNode(id);
			if (!node) {
				console.warn(
					`Node not found for ID ${id} while enforcing visibility group ${visibilityGroupId}`
				);
				return;
			}

			this.setVisibilityState(node, false);
			const index = activeNodes.indexOf(id);
			if (index >= 0) {
				activeNodes.splice(index, 1);
			}
		};

		while (activeNodes.length >= visibilityGroupConfig.maxVisibleLayers) {
			const oldestId = activeNodes[0]; // oldest is at the front
			hideId(oldestId);
		}

		activeNodes.push(ownerNode.id);
	}

	/**
	 * Sets the visibility state of a variable node.
	 * @param node The variable treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private setVariableVisibilityState(node: VariableTreeviewNode, isVisible: boolean): void {
		const isCurrentlyVisible = this.visibilityStates.get(node.id);
		if (isCurrentlyVisible !== undefined && isVisible === isCurrentlyVisible) {
			return; // no change, do nothing
		}

		this.visibilityStates.set(node.id, isVisible);
		this.updateDependencyVisibility(node, isVisible);
		this.updateVisibilityGroup(node, isVisible);
		this.updateParentNodeVisibility(node, isVisible);

		switch (node.variableSubType) {
			case VariableSubType.Tile:
				this.handleTileVariableVisibilityState(node, isVisible);
				break;
			case VariableSubType.Field:
				this.handleFieldVariableVisibilityState(node, isVisible);
				break;
			default:
				console.warn(`Unknown variable subtype ${node.variableSubType} for node ${node.id}`);
		}
	}

	/**
	 * Handles the visibility state of a tile variable node.
	 * @param node The tile variable treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private handleTileVariableVisibilityState(node: VariableTreeviewNode, isVisible: boolean): void {
		this.setTileVariableDrawState(node, isVisible);
	}

	/**
	 * Handles the visibility state of a field variable node.
	 * @param node The field variable treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private handleFieldVariableVisibilityState(node: VariableTreeviewNode, isVisible: boolean): void {
		const datasetNode: DatasetTreeviewNode | null = this.getDatasetNodeForVariable(node);
		if (!datasetNode) {
			console.warn(`Dataset node not found for variable node ${node.id}`);
			return;
		}

		this.setDatasetVisibilityState(datasetNode, isVisible);
	}

	/**
	 * Sets the draw state of a tile variable node by updating the visibility of its associated layer view.
	 * @param node The tile variable treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private async setTileVariableDrawState(
		node: VariableTreeviewNode,
		isVisible: boolean
	): Promise<void> {
		const drawState: NodeDrawState | undefined = this.drawStates.get(node.id);
		if (!isVisible && drawState === NodeDrawState.Hidden) {
			return;
		}

		const parentLayerId = node.layerId;
		const parentLayerView: __esri.LayerView | undefined =
			await this.#layerViewProvider.getLayerViewById(parentLayerId);
		if (!parentLayerView) {
			console.warn(
				`Layer view not found for variable node ${node.id} with parent layer ID ${parentLayerId}`
			);
			return;
		}

		const layerIndex: number = Number(node.variableId);
		const subLayer: __esri.Sublayer | undefined = (
			parentLayerView.layer as __esri.MapImageLayer
		)?.allSublayers?.find((sublayer) => sublayer.id === layerIndex);

		if (!subLayer) {
			console.warn(
				`Sublayer not found for node ${node.id} with layer ID ${node.layerId} and index ${layerIndex}`,
				node
			);
			return;
		}

		subLayer.visible = isVisible;
		parentLayerView.visible = isVisible;
		this.updateParentNodeVisibility(node, isVisible);
		this.updateParentLayerVisibility(subLayer, isVisible);

		if (!isVisible) {
			this.drawStates.delete(node.id);
			return; // don't subscribe if not visible
		}

		this.drawStates.set(node.id, NodeDrawState.Visible);
	}

	/**
	 * Gets the dataset node associated with a given variable node by traversing up the tree.
	 * @param node The variable node.
	 * @returns The dataset treeview node.
	 */
	private getDatasetNodeForVariable(node: VariableTreeviewNode): DatasetTreeviewNode | null {
		let currentNode: TreeviewNode | null = node;
		let datasetNode: DatasetTreeviewNode | null = null;
		while (currentNode.parent) {
			if (this.isDatasetNode(currentNode.parent)) {
				datasetNode = currentNode.parent;
				break;
			}

			currentNode = currentNode.parent;
		}

		return datasetNode;
	}

	/**
	 * Sets the visibility state of a folder node.
	 * @param node The folder treeview node.
	 * @param isVisible A flag that determines if the node should be visible or not.
	 */
	private setFolderVisibilityState(node: TreeviewNode, isVisible: boolean): void {
		const isCurrentlyVisible = this.visibilityStates.get(node.id);
		if (isCurrentlyVisible !== undefined && isVisible === isCurrentlyVisible) {
			return; // no change, do nothing
		}

		this.visibilityStates.set(node.id, isVisible);
		if (!isVisible) {
			this.hideChildNodes(node);
		}

		this.updateParentNodeVisibility(node, isVisible);
	}

	/**
	 * Sets the initial draw state of a node based on its layer view's suspended property.
	 * @param node The node to set.
	 * @param layerView The layer view.
	 */
	private setInitialDrawState(node: TreeviewNode, layerView: __esri.LayerView): void {
		if (!this.isDatasetNode(node)) {
			return;
		}

		if (!layerView) {
			return;
		}

		if (layerView.suspended) {
			this.drawStates.set(node.id, NodeDrawState.Suspended);
		} else {
			this.drawStates.set(node.id, NodeDrawState.Visible);
		}
	}

	/**
	 * Recursively updates the visibility of parent nodes based on the visibility of a child node.
	 * @param node The node that was updated.
	 * @param isVisible The new visibility state of the node.
	 */
	private updateParentNodeVisibility(node: TreeviewNode, isVisible: boolean): void {
		if (!node.parent) {
			return;
		}

		if (isVisible) {
			this.visibilityStates.set(node.parent.id, true);
			this.updateParentNodeVisibility(node.parent, true);
			return;
		}

		if (this.anyDescendantNodeVisible(node.parent)) {
			return;
		}

		this.visibilityStates.set(node.parent.id, false);
		this.updateParentNodeVisibility(node.parent, false);
	}

	/**
	 * Checks if any child layers of a given layer are visible.
	 * @param layer The layer to check.
	 * @returns True if any child layers are visible, false otherwise.
	 */
	private parentHasAnyVisibleChild(
		layer: __esri.Layer | __esri.Sublayer | __esri.SubtypeSublayer
	): boolean {
		if (layer.type === 'group') {
			const group = layer as __esri.GroupLayer;
			return group.layers.some((child) => this.parentHasAnyVisibleChild(child));
		}

		if (layer.type === 'map-image') {
			const mapImage = layer as __esri.MapImageLayer;
			return (
				mapImage.allSublayers?.some((sublayer) => this.parentHasAnyVisibleChild(sublayer)) ?? false
			);
		}

		if (layer.type === 'subtype-group') {
			const subtypeGroup = layer as __esri.SubtypeGroupLayer;
			return (
				subtypeGroup.sublayers?.some((sublayer) => this.parentHasAnyVisibleChild(sublayer)) ?? false
			);
		}

		if ('sublayers' in layer && layer.sublayers?.length) {
			return layer.sublayers.some((sublayer) => this.parentHasAnyVisibleChild(sublayer));
		}

		return true;
	}

	/**
	 * Recursively updates the visibility of parent layers based on the visibility of a child layer.
	 * @param layer The layer that was updated.
	 * @param isVisible The new visibility state of the layer.
	 */
	private updateParentLayerVisibility(
		layer: __esri.Layer | __esri.Sublayer,
		isVisible: boolean
	): void {
		const parent = layer.parent;
		if (!parent || !('visible' in parent)) return;

		if (isVisible) {
			parent.visible = true;
			this.updateParentLayerVisibility(parent, true);
			return;
		}

		// hiding: only hide parent if it has no visible children left
		if (this.parentHasAnyVisibleChild(parent)) return;

		parent.visible = false;
		this.updateParentLayerVisibility(parent, false);
	}

	/**
	 * Checks if any descendant nodes of a given treeview node are visible.
	 * @param node The treeview node to check.
	 * @returns True if any descendant nodes are visible, false otherwise.
	 */
	private anyDescendantNodeVisible(node: TreeviewNode): boolean {
		return node.children.some((child) => this.anyDescendantNodeVisible(child));
	}

	/**
	 * Updates the visibility of nodes that are dependent on the given node's visibility. This is used to enforce visibility dependencies defined in the
	 * node configuration.
	 * @param node The node update the dependencies of.
	 * @param isVisible The new visibility state of the node.
	 */
	private updateDependencyVisibility(node: TreeviewNode, isVisible: boolean): void {
		const config: TreeviewNodeConfig | undefined = this.#nodeConfigProvider.getConfig(node.id);
		if (!config) {
			return;
		}

		if (!config.visibilityDependencyIds?.length) {
			return;
		}

		for (const dependencyId of config.visibilityDependencyIds) {
			//console.warn(`updateDependencyVisibility not implemented yet.`);
		}
	}

	/**
	 * Checks if a given node is a folder TreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a folder TreeviewNode, false otherwise.
	 */
	private isFolderNode(node: TreeviewNode): node is TreeviewNode {
		return node.type === TreeviewNodeType.Folder;
	}

	/**
	 * Checks if a given node is a DatasetTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
	 */
	private isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}

	/**
	 * Checks if a given node is a VariableTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a VariableTreeviewNode, false otherwise.
	 */
	private isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
		return node.type === TreeviewNodeType.Variable;
	}
}
