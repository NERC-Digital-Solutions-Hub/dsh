import { SvelteSet } from 'svelte/reactivity';

export type SelectedData = {
	layerId: string;
	name: string;
	fields: string[] | null; // null means all fields
};

/**
 * Store for managing the data selected for download.
 */
class SelectedDataStore {
	public SelectedData = $state<SvelteSet<SelectedData>>(new SvelteSet());
}

export const selectedDataStore = new SelectedDataStore();
