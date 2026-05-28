import {
	DatasetTreeviewNode,
	NodeDrawState,
	TreeviewNode,
	VariableTreeviewNode
} from '$lib/Models/Treeview/Index';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import type { INodeProvider } from '$lib/Services/INodeProvider';
import type { INodeVisibilityController } from '$lib/Services/INodeVisibilityController';
import type { INodeVisibilityRenderer } from '$lib/Services/INodeVisibilityRenderer';
import type { IVisibilityGroupProvider } from '$lib/Services/IVisibilityGroupProvider';
import {
	getDatasetNodeForVariable,
	getLinkedVisibilityNodes,
	getNodeVisibilityRenderTarget
} from '$lib/Services/NodeVisibilityTargets';
import type { TreeviewNodeConfig, VisibilityGroupConfig } from '$lib/Types/Treeview.types';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Coordinates tree node visibility state and delegates render-engine updates through
 * a renderer-neutral bridge.
 */
export class NodeVisibilityController implements INodeVisibilityController {
	/** @inheritdoc */
	public readonly drawStates: Map<string, NodeDrawState> = $state(new SvelteMap());

	/** @inheritdoc */
	public readonly visibilityStates: Map<string, boolean> = $state(new SvelteMap());

	/** Optional renderer bridge used to apply visibility state to a map/rendering engine. */
	#visibilityRenderer: INodeVisibilityRenderer | null;

	/** The node provider to use for accessing treeview nodes. */
	readonly #nodeProvider: INodeProvider;

	/** The node config provider to use for accessing node configuration such as visibility groups. */
	readonly #nodeConfigProvider: INodeConfigProvider;

	/** The visibility group provider to use for managing visibility groups. */
	readonly #visibilityGroupProvider: IVisibilityGroupProvider;

	/** Map of active node in each visibility group to enforce single active visibility per group. */
	readonly #activeInVisibilityGroup: Map<string, string[]> = new SvelteMap();

	constructor(
		nodeProvider: INodeProvider,
		nodeConfigProvider: INodeConfigProvider,
		visibilityGroupProvider: IVisibilityGroupProvider,
		visibilityRenderer?: INodeVisibilityRenderer | null
	) {
		this.#visibilityRenderer = visibilityRenderer ?? null;
		this.#nodeProvider = nodeProvider;
		this.#nodeConfigProvider = nodeConfigProvider;
		this.#visibilityGroupProvider = visibilityGroupProvider;
	}

	/** @inheritdoc */
	public getDrawState(node: TreeviewNode): NodeDrawState | undefined {
		if (this.isDatasetNode(node)) {
			return this.drawStates.get(node.id);
		}

		if (this.isVariableNode(node)) {
			if (node.capabilities.render) {
				return this.drawStates.get(node.capabilities.render.drawStateNodeId ?? node.id);
			}

			const datasetNode: DatasetTreeviewNode | null = getDatasetNodeForVariable(node);
			if (!datasetNode) {
				console.warn(`Dataset node not found for variable node ${node.id}`);
				return undefined;
			}
			return this.drawStates.get(datasetNode.id);
		}

		const visibilityState = this.visibilityStates.get(node.id);
		if (visibilityState) {
			if (this.anyDescendantNodeSuspended(node)) {
				return NodeDrawState.Suspended;
			}
			return NodeDrawState.Visible;
		}

		if (this.anyDescendantNodeVisible(node)) {
			if (this.anyDescendantNodeSuspended(node)) {
				return NodeDrawState.Suspended;
			}
			return NodeDrawState.Visible;
		}

		return NodeDrawState.Hidden;
	}

	/** @inheritdoc */
	public getVisibilityState(node: TreeviewNode): boolean {
		return this.visibilityStates.get(node.id) ?? false;
	}

	/** @inheritdoc */
	public setVisibilityState(node: TreeviewNode, isVisible: boolean): void {
		const isCurrentlyVisible = this.visibilityStates.get(node.id);
		if (isCurrentlyVisible !== undefined && isVisible === isCurrentlyVisible) {
			return;
		}

		this.applyVisibilityState(node, isVisible);
	}

	/** @inheritdoc */
	public reset(): void {
		this.drawStates.clear();
		this.visibilityStates.clear();
		this.#activeInVisibilityGroup.clear();
		this.#visibilityRenderer?.reset();
	}

	/**
	 * Sets the renderer bridge and syncs tracked visibility states into it.
	 * @param renderer The renderer bridge used to apply visibility state outside the tree.
	 */
	public setVisibilityRenderer(renderer: INodeVisibilityRenderer): void {
		this.#visibilityRenderer = renderer;
		this.syncVisibilityStatesToRenderer();
	}

	private applyVisibilityState(node: TreeviewNode, isVisible: boolean): void {
		this.visibilityStates.set(node.id, isVisible);
		if (!isVisible) {
			this.hideChildNodes(node);
		}

		this.updateVisibilityGroup(node, isVisible);
		this.updateLinkedVisibilityStates(node, isVisible);
		this.updateDependencyVisibility(node, isVisible);
		this.updateParentNodeVisibility(node, isVisible);
		this.applyNodeRenderTarget(node, isVisible);
	}

	private updateLinkedVisibilityStates(node: TreeviewNode, isVisible: boolean): void {
		for (const linkedNode of getLinkedVisibilityNodes(node)) {
			const isCurrentlyVisible = this.visibilityStates.get(linkedNode.id);
			if (isCurrentlyVisible !== undefined && isVisible === isCurrentlyVisible) {
				continue;
			}

			this.visibilityStates.set(linkedNode.id, isVisible);
			this.updateDependencyVisibility(linkedNode, isVisible);
			this.updateParentNodeVisibility(linkedNode, isVisible);
		}
	}

	private applyNodeRenderTarget(node: TreeviewNode, isVisible: boolean): void {
		const target = getNodeVisibilityRenderTarget(node);
		if (!target || !this.#visibilityRenderer) {
			return;
		}

		void this.#visibilityRenderer.applyVisibility({
			sourceNode: node,
			target,
			isVisible,
			setDrawState: (drawState) => this.setDrawState(target.drawStateNodeId, drawState)
		});
	}

	private syncVisibilityStatesToRenderer(): void {
		for (const [nodeId, isVisible] of this.visibilityStates) {
			const node = this.#nodeProvider.getTreeviewNode(nodeId);
			if (!node) continue;
			this.applyNodeRenderTarget(node, isVisible);
		}

		for (const [nodeId, isVisible] of this.visibilityStates) {
			const node = this.#nodeProvider.getTreeviewNode(nodeId);
			if (!node) continue;
			this.updateDependencyVisibility(node, isVisible);
		}
	}

	private setDrawState(nodeId: string, drawState: NodeDrawState | undefined): void {
		if (drawState === undefined) {
			this.drawStates.delete(nodeId);
			return;
		}

		this.drawStates.set(nodeId, drawState);
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
	 * Update the visibility of nodes in the same visibility group.
	 * @param node The node to add to its visibility group.
	 * @param isVisible The new visibility state.
	 */
	private updateVisibilityGroup(node: TreeviewNode, isVisible: boolean): void {
		const config: TreeviewNodeConfig | undefined = this.#nodeConfigProvider.getConfig(node.id);
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
			const index = activeNodes.indexOf(node.id);
			if (index === -1) {
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
			const oldestId = activeNodes[0];
			hideId(oldestId);
		}

		activeNodes.push(node.id);
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

	private anyDescendantNodeVisible(node: TreeviewNode): boolean {
		return node.children.some(
			(child) => this.visibilityStates.get(child.id) || this.anyDescendantNodeVisible(child)
		);
	}

	private anyDescendantNodeSuspended(node: TreeviewNode): boolean {
		if (this.drawStates.get(node.id) === NodeDrawState.Suspended) {
			return true;
		}

		return !!node.children?.some((child) => this.anyDescendantNodeSuspended(child));
	}

	/**
	 * Updates renderer-side visibility dependencies defined in node configuration.
	 * @param node The node to update dependencies for.
	 * @param isVisible The new visibility state of the node.
	 */
	private updateDependencyVisibility(node: TreeviewNode, isVisible: boolean): void {
		if (!this.#visibilityRenderer) {
			return;
		}

		const config: TreeviewNodeConfig | undefined = this.#nodeConfigProvider.getConfig(node.id);
		if (!config?.visibilityDependencyIds?.length) {
			return;
		}

		for (const dependencyId of config.visibilityDependencyIds) {
			const dependentNode = this.#nodeProvider.getTreeviewNode(dependencyId);
			if (!dependentNode) {
				console.warn(
					`Dependent node with ID ${dependencyId} not found for node ${node.id} while enforcing visibility dependencies`
				);
				continue;
			}

			if (!this.isDatasetNode(dependentNode)) {
				console.warn(
					`Dependent node with ID ${dependencyId} for node ${node.id} is not a dataset node, which is required for visibility dependencies`
				);
				continue;
			}

			const target = getNodeVisibilityRenderTarget(dependentNode);
			if (!target) {
				continue;
			}

			void this.#visibilityRenderer.applyDependencyVisibility({
				sourceNode: node,
				dependentNode,
				target,
				isVisible
			});
		}
	}

	private isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}

	private isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
		return node.type === TreeviewNodeType.Variable;
	}
}
