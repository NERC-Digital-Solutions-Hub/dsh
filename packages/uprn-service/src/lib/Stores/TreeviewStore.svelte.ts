import {
	DatasetTreeviewNode,
	NodeDrawState,
	SelectionState,
	TreeviewNode
} from '$lib/Models/Treeview/Index.js';
import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import type { INodePathResolver } from '$lib/Services/INodePathResolver';
import type { INodeProvider } from '$lib/Services/INodeProvider';
import type { INodeSelectionController } from '$lib/Services/INodeSelectionController';
import type { INodeTagProvider } from '$lib/Services/INodeTagProvider';
import type { INodeVisibilityController } from '$lib/Services/INodeVisibilityController';
import { TreeviewType } from '$lib/Types/Treeview.types.js';
import { SvelteMap } from 'svelte/reactivity';

export class TreeviewStore
	implements INodeTagProvider, INodeSelectionController, INodePathResolver
{
	readonly #treeviewType: TreeviewType;

	readonly #nodeProvider: INodeProvider;

	readonly #nodeConfigProvider: INodeConfigProvider;

	readonly #nodeTagProvider: INodeTagProvider;

	readonly #nodeSelectionController: INodeSelectionController;

	readonly #nodeVisibilityController: INodeVisibilityController;

	/** Map of node IDs to their current visibility state. */
	#visibilityStates: SvelteMap<string, boolean> = $derived.by(() => {
		const map = new SvelteMap<string, boolean>();
		for (const [nodeId, visibilityState] of this.#nodeVisibilityController.visibilityStates) {
			const node = this.#nodeProvider.getTreeviewNode(nodeId);
			if (!node) {
				// console.warn(
				// 	`Node not found for ID ${nodeId} while building visibility states map`,
				// 	this.#nodeVisibilityController.visibilityStates
				// );
				continue;
			}

			map.set(node.id, visibilityState);
		}

		return map;
	});

	/** Map of node IDs to their current draw state. Automatically updates when nodeDrawStateHandler.drawStates changes. */
	#drawStates: SvelteMap<string, NodeDrawState> = $derived.by(() => {
		const map = new SvelteMap<string, NodeDrawState>();
		for (const [nodeId, drawState] of this.#nodeVisibilityController.drawStates) {
			const node = this.#nodeProvider.getTreeviewNode(nodeId);
			if (node && this.isDatasetNode(node)) {
				map.set(node.id, drawState);
			}
		}

		return map;
	});

	/** Map of node IDs to their current expanded/open state in the treeview. */
	#expansionStates: SvelteMap<string, boolean> = new SvelteMap<string, boolean>();

	constructor(
		treeviewType: TreeviewType,
		nodeProvider: INodeProvider,
		nodeConfigProvider: INodeConfigProvider,
		nodeTagProvider: INodeTagProvider,
		nodeSelectionController: INodeSelectionController,
		nodeVisibilityController: INodeVisibilityController
	) {
		if (!treeviewType) {
			throw new Error('TreeviewStore requires a valid TreeviewType to initialize.');
		}

		this.#treeviewType = treeviewType;

		if (!nodeProvider) {
			throw new Error('TreeviewStore requires a valid INodeProvider to initialize.');
		}

		this.#nodeProvider = nodeProvider;

		if (!nodeConfigProvider) {
			throw new Error('TreeviewStore requires a valid INodeConfigProvider to initialize.');
		}

		this.#nodeConfigProvider = nodeConfigProvider;

		if (!nodeTagProvider) {
			throw new Error('TreeviewStore requires a valid INodeTagProvider to initialize.');
		}

		this.#nodeTagProvider = nodeTagProvider;

		if (!nodeSelectionController) {
			throw new Error('TreeviewStore requires a valid INodeSelectionController to initialize.');
		}

		this.#nodeSelectionController = nodeSelectionController;

		if (!nodeVisibilityController) {
			throw new Error('TreeviewStore requires a valid INodeDrawStateHandler to initialize.');
		}

		this.#nodeVisibilityController = nodeVisibilityController;
	}

	public getNodeById(id: string): TreeviewNode | undefined {
		return this.#nodeProvider.getTreeviewNode(id);
	}

	public getNodes(): TreeviewNode[] {
		return this.#nodeProvider.getAllTreeviewNodes();
	}

	public getVisibleNodes(): TreeviewNode[] {
		const visibleNodes: TreeviewNode[] = [];
		for (const [nodeId, isVisible] of this.#visibilityStates) {
			if (!isVisible) {
				continue;
			}

			const node = this.#nodeProvider.getTreeviewNode(nodeId);
			if (node) {
				visibleNodes.push(node);
			}
		}

		return visibleNodes;
	}

	public getNonHiddenNodes(): TreeviewNode[] {
		return this.#getNonHiddenNodes(this.#nodeProvider.getAllTreeviewNodes());
	}

	public getSelectionState(node: TreeviewNode): SelectionState {
		return this.#nodeSelectionController.getSelectionState(node);
	}

	public setSelectionState(node: TreeviewNode, state: SelectionState): void {
		this.#nodeSelectionController.setSelectionState(node, state);
	}

	public clearSelections(): void {
		this.#nodeSelectionController.reset();
	}

	/**
	 * Gets the visibility state of a node by its ID.
	 * @param nodeId - The ID of the node to check visibility for
	 * @returns True if the node is visible, otherwise false
	 */
	public getVisibilityState(nodeId: string): boolean {
		return this.#visibilityStates.get(nodeId) ?? false;
	}

	public setVisibilityState(nodeId: string, isVisible: boolean): void {
		const node = this.#nodeProvider.getTreeviewNode(nodeId);
		if (!node) {
			console.warn(`Node not found for ID ${nodeId} while setting visibility state`);
			return;
		}

		this.#nodeVisibilityController.setVisibilityState(node, isVisible);
	}

	public getExpansionState(nodeId: string, defaultState = false): boolean {
		return this.#expansionStates.get(nodeId) ?? defaultState;
	}

	public setExpansionState(nodeId: string, isExpanded: boolean): void {
		if (!this.#nodeProvider.getTreeviewNode(nodeId)) {
			console.warn(`Node not found for ID ${nodeId} while setting expansion state`);
			return;
		}

		this.#expansionStates.set(nodeId, isExpanded);
	}

	public getNodeDrawState(nodeId: string): NodeDrawState {
		const directState = this.#drawStates.get(nodeId);
		if (directState !== undefined) {
			return directState;
		}

		const node = this.#nodeProvider.getTreeviewNode(nodeId);
		if (!node?.children?.length) {
			return NodeDrawState.Hidden;
		}

		if (this.#anyDescendantSuspended(node)) {
			return NodeDrawState.Suspended;
		}

		return this.#visibilityStates.get(nodeId) ? NodeDrawState.Visible : NodeDrawState.Hidden;
	}

	#anyDescendantSuspended(node: TreeviewNode): boolean {
		if (this.#drawStates.get(node.id) === NodeDrawState.Suspended) {
			return true;
		}

		return !!node.children?.some((child) => this.#anyDescendantSuspended(child));
	}

	public reset(): void {
		this.#visibilityStates.clear();
		this.#drawStates.clear();
		this.#expansionStates.clear();
		this.#nodeSelectionController.reset();
		this.#nodeVisibilityController.reset();
	}

	/** @inheritdoc */
	public getTags(nodeId: string): string[] {
		return this.#nodeTagProvider?.getTags(nodeId) ?? [];
	}

	/** @inheritdoc */
	public getNodePathById(nodeId: string): string | undefined {
		const node = this.#nodeProvider.getTreeviewNode(nodeId);
		if (!node) {
			return undefined;
		}

		return this.#buildNodePath(node);
	}

	/** @inheritdoc */
	public getNodeIdByPath(nodePath: string): string | undefined {
		const segments = nodePath.split('/');
		const roots = this.#nodeProvider.getAllTreeviewNodes();

		let current: TreeviewNode | undefined;
		let candidates = roots;

		for (const segment of segments) {
			current = candidates.find((n) => n.name === segment);
			if (!current) {
				return undefined;
			}
			candidates = current.children;
		}

		return current?.id;
	}

	#buildNodePath(node: TreeviewNode): string {
		const parts: string[] = [];
		let current: TreeviewNode | null = node;
		while (current) {
			parts.push(current.name);
			current = current.parent;
		}
		return parts.reverse().join('/');
	}

	#getNonHiddenNodes(nodes: TreeviewNode[]): TreeviewNode[] {
		const nonHiddenNodes: TreeviewNode[] = [];
		for (const node of nodes) {
			const nodeConfig = this.#nodeConfigProvider.getConfig(node.id);
			if (nodeConfig && (nodeConfig.isHidden || nodeConfig.treeviewType !== this.#treeviewType)) {
				continue;
			}

			nonHiddenNodes.push(node);

			if (node.children?.length) {
				const childNonHidden = this.#getNonHiddenNodes(node.children);
				nonHiddenNodes.push(...childNonHidden);
			}
		}

		return nonHiddenNodes;
	}

	/**
	 * Checks if a given node is a DatasetTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
	 */
	private isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}
}
