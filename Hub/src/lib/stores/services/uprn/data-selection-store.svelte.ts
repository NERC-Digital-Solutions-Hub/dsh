import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';

export type DataSelection = {
	layerId: string;
	name: string;
	fields: SvelteSet<string> | null; // null means all fields
};

/**
 * Store for managing the data selected for download.
 */
class DataSelectionStore {
	public DataSelections = $state<SvelteMap<string, DataSelection>>(new SvelteMap());

	public addSelection(dataSelection: DataSelection) {
		this.DataSelections.set(dataSelection.layerId, dataSelection);
		toast.success(`'${dataSelection.name}' Added`);
	}

	public removeSelection(layerId: string) {
		const removed = this.DataSelections.get(layerId);
		this.DataSelections.delete(layerId);
		toast.success(`'${removed?.name}' Removed`);
	}
}

export const dataSelectionStore = new DataSelectionStore();
