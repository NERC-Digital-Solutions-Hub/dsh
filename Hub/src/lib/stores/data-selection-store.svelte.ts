import { SvelteMap } from 'svelte/reactivity';

export type SelectedData = {
	layerId: string;
	name: string;
	fields: string[] | null; // null means all fields
};

/**
 * Store for managing the data selected for download.
 */
class DataSelectionStore {
	public SelectedData = $state<SvelteMap<string, SelectedData>>(new SvelteMap());
	public FieldViewSelection = $state<string | null>(null);
}

export const dataSelectionStore = new DataSelectionStore();
