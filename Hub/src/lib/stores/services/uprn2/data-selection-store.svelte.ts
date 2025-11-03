import { SvelteMap } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';

import type { DataSelection } from '$lib/types/uprn';

/**
 * Store for managing the data selected for download.
 */
class DataSelectionStore {
	#dataSelections = $state<SvelteMap<string, DataSelection>>(new SvelteMap());

	/**
	 * Add a DataSelection to the store.
	 *
	 * Stores the provided DataSelection keyed by its layerId and shows a
	 * success toast to indicate the selection has been added.
	 *
	 * @param dataSelection - The DataSelection object to add.
	 */
	public addSelection(dataSelection: DataSelection) {
		this.#dataSelections.set(dataSelection.layerId, dataSelection);
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
		const removed = this.#dataSelections.get(layerId);
		this.#dataSelections.delete(layerId);
		toast.success(`'${removed?.layer.title}' Removed`);
	}

	/**
	 * Get the DataSelection for a given layer id.
	 *
	 * @param layerId - The id of the layer to retrieve the selection for.
	 * @returns The DataSelection if it exists, otherwise undefined.
	 */
	public getSelection(layerId: string): DataSelection | undefined {
		return this.#dataSelections.get(layerId);
	}

	/**
	 * Get all DataSelections in the store.
	 *
	 * @returns An array of all DataSelection objects currently stored.
	 */
	public getAllSelections(): DataSelection[] {
		return Array.from(this.#dataSelections.values());
	}

	/**
	 * Clear all DataSelections from the store.
	 */
	public clearSelections(): void {
		this.#dataSelections.clear();
		console.log('[data-selection-store] selections cleared.');
	}

	/**
	 * Clear all DataSelections from the store.
	 */
	public cleanup(): void {
		this.#dataSelections.clear();
	}
}

export const dataSelectionStore = new DataSelectionStore();
export type { DataSelectionStore };
