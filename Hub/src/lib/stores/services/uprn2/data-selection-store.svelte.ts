import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import {
	DownloadState,
	TreeNode,
	TreeFieldNode,
	TreeLayerNode
} from '$lib/components/common/services/uprn2/tree-view/types';
import type { DataSelection } from '$lib/types/uprn';

/**
 * Store for managing the data selected for download.
 */
class DataSelectionStore {
	public DataSelections = $state<SvelteMap<string, DataSelection>>(new SvelteMap());

	/**
	 * Add a DataSelection to the store.
	 *
	 * Stores the provided DataSelection keyed by its layerId and shows a
	 * success toast to indicate the selection has been added.
	 *
	 * @param dataSelection - The DataSelection object to add.
	 */
	public addSelection(dataSelection: DataSelection) {
		this.DataSelections.set(dataSelection.layerId, dataSelection);
		toast.success(`'${dataSelection.layer.title}' Added`);
	}

	/**
	 * Remove a DataSelection from the store by layer id.
	 *
	 * If a selection existed for the provided id it will be deleted and a
	 * success toast will be shown with the removed selection's name. If no
	 * selection existed, the method is a no-op.
	 *
	 * @param layerId - The id of the layer whose selection should be removed.
	 */
	public removeSelection(layerId: string) {
		const removed = this.DataSelections.get(layerId);
		this.DataSelections.delete(layerId);
		toast.success(`'${removed?.layer.title}' Removed`);
	}

	/**
	 * Update the selection state for a node in the tree.
	 *
	 * This method routes the update to the appropriate handler depending on
	 * whether the node is a layer node, a field node or a generic node with
	 * children. For non-layer nodes, the children are updated recursively.
	 *
	 * @param node - The TreeNode to update.
	 * @param state - The desired DownloadState for the node.
	 */
	public updateSelection(node: TreeNode, state: DownloadState) {
		if (!(node instanceof TreeLayerNode)) {
			// in this case, either all its children are selected or none are.
			this.updateChildrenSelection(node, state);
			return;
		}

		if (node instanceof TreeFieldNode) {
			this.updateFieldSelection(node, state);
			return;
		}

		this.updateLayerSelection(node, state);
	}

	public cleanup(): void {
		this.DataSelections.clear();
	}

	/**
	 * Get the DownloadState for a node.
	 *
	 * For non-layer nodes or group layers the state is derived from their
	 * children's states. For field nodes the state is Active when the field
	 * is present in the corresponding DataSelection.fields set. For regular
	 * layer nodes without visible fields, the presence of a DataSelection
	 * entry indicates Active, otherwise Inactive.
	 *
	 * @param node - The TreeNode to inspect.
	 * @returns The computed DownloadState for the node.
	 */
	public getSelectionState(node: TreeNode): DownloadState {
		if (!(node instanceof TreeLayerNode)) {
			return this.determineSelectionStateFromChildren(node);
		}

		if (this.isGroupLayer(node)) {
			return this.determineSelectionStateFromChildren(node);
		}

		let selection;
		if (node instanceof TreeFieldNode) {
			selection = this.DataSelections.get(node.featureLayer.id);
			if (!selection) {
				return DownloadState.Inactive;
			}

			return selection.fields.has(node.field.name) ? DownloadState.Active : DownloadState.Inactive;
		}

		selection = this.DataSelections.get(node.id);
		if (!selection) {
			return DownloadState.Inactive;
		}

		// if the layer has fields shown, check if all fields are selected...
		if (this.isFeatureLayer(node) && node.children && node.children.length > 0) {
			return this.determineSelectionStateFromChildren(node);
		}

		return DownloadState.Active;
	}

	/**
	 * Update selection for a layer node.
	 *
	 * - When activating: ensures a DataSelection exists for non-group
	 *   layers and propagates the Active state to children.
	 * - When deactivating: removes the DataSelection for non-group layers
	 *   and propagates Inactive to children (useful for group layers).
	 *
	 * @param node - The TreeLayerNode to update.
	 * @param state - The desired DownloadState for the layer.
	 */
	private updateLayerSelection(node: TreeLayerNode, state: DownloadState) {
		let selection = this.DataSelections.get(node.id);

		switch (state) {
			case DownloadState.Active:
				if (!selection && !this.isGroupLayer(node)) {
					selection = this.createAndAddDataSelection(node.id, node.layer);
				}

				for (const child of node.children || []) {
					this.updateSelection(child, state);
				}
				break;
			case DownloadState.Inactive:
				if (selection && !this.isGroupLayer(node)) {
					this.removeSelection(node.id);
				}

				this.updateChildrenSelection(node, state); // if group layer, unselect all children
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
	 * @param node - The TreeFieldNode representing the field.
	 * @param state - The desired DownloadState for the field.
	 */
	private updateFieldSelection(node: TreeFieldNode, state: DownloadState) {
		let selection = this.DataSelections.get(node.featureLayer.id);

		switch (state) {
			case DownloadState.Active:
				if (!selection) {
					selection = this.createAndAddDataSelection(
						node.featureLayer.id,
						node.featureLayer
					);
				}

				selection.fields.add(node.field.name);
				break;
			case DownloadState.Inactive:
				if (!selection) {
					break;
				}

				selection.fields.delete(node.field.name);
				if (selection.fields.size === 0) {
					this.removeSelection(selection.layerId);
				}
				break;
		}
	}

	/**
	 * Recursively update the selection state for all children of the node.
	 *
	 * This helper iterates over the node's children (if any) and applies the
	 * provided state to each child using updateSelection.
	 *
	 * @param node - The TreeNode whose children should be updated.
	 * @param state - The DownloadState to apply to each child.
	 */
	private updateChildrenSelection(node: TreeNode, state: DownloadState) {
		for (const child of node.children || []) {
			this.updateSelection(child, state);
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
	private determineSelectionStateFromChildren(node: TreeNode): DownloadState {
		let selectedCount = 0;
		let totalCount = 0;

		for (const child of node.children || []) {
			totalCount++;
			const childState = this.getSelectionState(child);
			if (
				childState === DownloadState.Active ||
				(this.isFeatureLayer(child) && childState !== DownloadState.Inactive) // NOTE: This condition ensures that feature layers with some fields selected are counted as active
			) {
				selectedCount++;
			} else if (childState === DownloadState.Indeterminate) {
				return DownloadState.Indeterminate;
			}
		}

		if (selectedCount === 0) {
			return DownloadState.Inactive;
		}

		if (selectedCount === totalCount) {
			return DownloadState.Active;
		}

		return DownloadState.Indeterminate;
	}

	/**
	 * Create a new DataSelection object and add it to the store.
	 *
	 * The created DataSelection will have an empty SvelteSet for fields.
	 * The selection is added to DataSelections via addSelection and the
	 * created object is returned for immediate use.
	 *
	 * @param id - The layer id to use for the DataSelection.layerId.
	 * @param layer - The layer to associate with the DataSelection.
	 * @returns The newly created DataSelection.
	 */
	private createAndAddDataSelection(id: string, layer: __esri.Layer | __esri.Sublayer): DataSelection {
		const selection: DataSelection = {
			layerId: id,
			layer: layer,
			fields: new SvelteSet()
		};

		this.addSelection(selection);
		return selection;
	}

	/**
	 * Predicate that returns true when the provided node is a group layer.
	 *
	 * @param node - The TreeNode to test.
	 * @returns True if the node is a TreeLayerNode with type 'group'.
	 */
	private isGroupLayer(node: TreeNode): boolean {
		return node instanceof TreeLayerNode && node.layer.type === 'group';
	}

	/**
	 * Predicate that returns true when the provided node is a feature layer.
	 *
	 * @param node - The TreeNode to test.
	 * @returns True if the node is a TreeLayerNode with type 'feature'.
	 */
	private isFeatureLayer(node: TreeNode): boolean {
		return node instanceof TreeLayerNode && node.layer.type === 'feature';
	}
}

export const dataSelectionStore = new DataSelectionStore();
