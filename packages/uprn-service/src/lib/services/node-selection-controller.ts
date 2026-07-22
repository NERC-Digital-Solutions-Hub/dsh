import { SelectionState, TreeviewNode } from '$lib/models/treeview/index';
import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
import type { INodeSelectionController } from '$lib/services/i-node-selection-controller';
import type {
	DataSelectionSnapshot,
	DataSelectionStore
} from '$lib/stores/data-selection-store.svelte';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Controller for managing treeview selection state.
 *
 * This class provides methods to update and retrieve the selection state
 */
export class NodeSelectionController implements INodeSelectionController {
	#dataSelectionStore: DataSelectionStore;
	#nodeConfigProvider: INodeConfigProvider;

	/**
	 * Creates an instance of TreeviewSelectionController.
	 *
	 * @param dataSelectionStore - The DataSelectionStore instance to manage selections.
	 * @param nodeConfigProvider - The INodeConfigProvider instance for configuration data.
	 */
	constructor(dataSelectionStore: DataSelectionStore, nodeConfigProvider: INodeConfigProvider) {
		this.#dataSelectionStore = dataSelectionStore;
		this.#nodeConfigProvider = nodeConfigProvider;
	}

	/** @inheritdoc */
	public getSelectionState(node: TreeviewNode): SelectionState {
		const selectableChildren = this.getSelectableChildren(node);

		if (!node.capabilities.selection) {
			return this.determineSelectionStateFromChildren(selectableChildren);
		}

		let selection;
		if (node.capabilities.selection?.kind === 'field') {
			selection = this.#dataSelectionStore.getSelection(node.capabilities.selection.sourceId);
			if (!selection) {
				return SelectionState.Inactive;
			}

			return selection.selectedFieldIds.has(node.capabilities.selection.fieldId)
				? SelectionState.Active
				: SelectionState.Inactive;
		}

		if (node.capabilities.selection?.kind !== 'dataset') {
			return SelectionState.Inactive;
		}

		if (selectableChildren.length > 0) {
			return this.determineSelectionStateFromChildren(selectableChildren);
		}

		selection = this.#dataSelectionStore.getSelection(node.capabilities.selection.sourceId);
		if (!selection) {
			return SelectionState.Inactive;
		}

		return SelectionState.Active;
	}

	/** @inheritdoc */
	public setSelectionState(node: TreeviewNode, state: SelectionState) {
		const nodeConfig = this.#nodeConfigProvider.getConfig(node.id);
		if (nodeConfig?.isHidden) {
			return; // hidden nodes should not be selectable
		}

		if (!node.capabilities.selection) {
			// in this case, either all its children are selected or none are.
			this.updateChildrenSelection(this.getSelectableChildren(node), state);
			return;
		}

		if (node.capabilities.selection.kind === 'field') {
			this.updateFieldSelection(node, state);
			return;
		}

		this.updateLayerSelection(node, state);
	}

	/** @inheritdoc */
	public reset() {
		this.#dataSelectionStore.clearSelections();
	}

	/**
	 * Update selection for a layer node.
	 *
	 * - When activating: ensures a DataSelection exists for non-group
	 *   layers and propagates the Active state to children.
	 * - When deactivating: removes the DataSelection for non-group layers
	 *   and propagates Inactive to children (useful for group layers).
	 *
	 * @param node - The LayerTreeviewNode to update.
	 * @param state - The desired DownloadState for the layer.
	 */
	private updateLayerSelection(node: TreeviewNode, state: SelectionState) {
		const selectionTarget = node.capabilities.selection;
		if (selectionTarget?.kind !== 'dataset') {
			this.updateChildrenSelection(this.getSelectableChildren(node), state);
			return;
		}

		let selection = this.#dataSelectionStore.getSelection(selectionTarget.sourceId);
		const selectableChildren = this.getSelectableChildren(node);

		switch (state) {
			case SelectionState.Active:
				if (selectableChildren.length === 0) {
					if (selection) {
						break;
					}

					selection = this.createAndAddDataSelection(selectionTarget.sourceId);
					break;
				}

				for (const child of selectableChildren) {
					this.setSelectionState(child, state);
				}
				break;
			case SelectionState.Inactive:
				if (selectableChildren.length === 0) {
					if (selection) {
						this.#dataSelectionStore.removeSelection(selectionTarget.sourceId);
					}
					break;
				}

				this.updateChildrenSelection(selectableChildren, state); // if group layer, unselect all children
				break;
		}
	}

	/**
	 * Update selection when toggling an individual field.
	 *
	 * Activating will ensure a DataSelection exists for the feature layer
	 * and will add the field name to the selection.fields set. Deactivating
	 * will remove the field from the set and remove the overall selection if
	 * no fields remain selected.
	 *
	 * @param node - The VariableTreeviewNode representing the field.
	 * @param state - The desired DownloadState for the field.
	 */
	private updateFieldSelection(node: TreeviewNode, state: SelectionState) {
		const selectionTarget = node.capabilities.selection;
		if (selectionTarget?.kind !== 'field') {
			return;
		}

		let selection = this.#dataSelectionStore.getSelection(selectionTarget.sourceId);

		switch (state) {
			case SelectionState.Active:
				if (!selection) {
					selection = this.createAndAddDataSelection(selectionTarget.sourceId);
				}

				this.#dataSelectionStore.addOrUpdateSelection(selectionTarget.sourceId, [
					...selection.selectedFieldIds,
					selectionTarget.fieldId
				]);
				break;
			case SelectionState.Inactive: {
				if (!selection) {
					break;
				}

				const updatedFieldIds = new SvelteSet<string>(selection.selectedFieldIds);
				updatedFieldIds.delete(selectionTarget.fieldId);
				this.#dataSelectionStore.addOrUpdateSelection(selectionTarget.sourceId, [
					...updatedFieldIds
				]);

				// selection.selectedFieldIds.delete(node.field.name);
				if (updatedFieldIds.size === 0) {
					this.#dataSelectionStore.removeSelection(selection.nodeId);
				}
				break;
			}
		}
	}

	/**
	 * Recursively update the selection state for all children of the node.
	 *
	 * This helper iterates over the node's children (if any) and applies the
	 * provided state to each child using updateSelection.
	 *
	 * @param node - The TreeviewNode whose children should be updated.
	 * @param state - The DownloadState to apply to each child.
	 */
	private updateChildrenSelection(children: TreeviewNode[], state: SelectionState) {
		for (const child of children) {
			this.setSelectionState(child, state);
		}
	}

	/**
	 * Determine a node's DownloadState based on its children's states.
	 *
	 * Counts Active (and partially-active feature layers) children. If any
	 * child is Indeterminate, the result is Indeterminate. If none are
	 * selected the result is Inactive. If all are selected the result is
	 * Active. Otherwise the result is Indeterminate.
	 *
	 * @param node - The parent node to evaluate.
	 * @returns The aggregated DownloadState derived from the children.
	 */
	private determineSelectionStateFromChildren(children: TreeviewNode[]): SelectionState {
		let selectedCount = 0;
		let totalCount = 0;

		for (const child of children) {
			totalCount++;
			const childState = this.getSelectionState(child);
			if (
				childState === SelectionState.Active ||
				(this.hasFieldSelectionDescendant(child) && childState !== SelectionState.Inactive)
			) {
				selectedCount++;
			} else if (childState === SelectionState.Indeterminate) {
				return SelectionState.Indeterminate;
			}
		}

		if (selectedCount === 0) {
			return SelectionState.Inactive;
		}

		if (selectedCount === totalCount) {
			return SelectionState.Active;
		}

		return SelectionState.Indeterminate;
	}

	private getSelectableChildren(node: TreeviewNode): TreeviewNode[] {
		return (node.children || []).filter((child) => {
			if (this.isNodeHidden(child)) {
				return false;
			}

			return Boolean(child.capabilities.selection) || this.getSelectableChildren(child).length > 0;
		});
	}

	private hasFieldSelectionDescendant(node: TreeviewNode): boolean {
		if (this.isNodeHidden(node)) {
			return false;
		}

		if (node.capabilities.selection?.kind === 'field') {
			return true;
		}

		return node.children.some((child) => this.hasFieldSelectionDescendant(child));
	}

	private isNodeHidden(node: TreeviewNode): boolean {
		return this.#nodeConfigProvider.getConfig(node.id)?.isHidden === true;
	}

	/**
	 * Create a new DataSelection object and add it to the store.
	 *
	 * The created DataSelection will have an empty SvelteSet for fields.
	 * The selection is added to DataSelections via addSelection and the
	 * created object is returned for immediate use.
	 *
	 * @param id - The layer id to use for the DataSelection.layerId.
	 * @returns The newly created DataSelection.
	 */
	private createAndAddDataSelection(id: string): DataSelectionSnapshot {
		const selection: DataSelectionSnapshot = {
			nodeId: id,
			selectedFieldIds: new SvelteSet<string>()
		};

		this.#dataSelectionStore.addSelection(selection);
		return selection;
	}
}
