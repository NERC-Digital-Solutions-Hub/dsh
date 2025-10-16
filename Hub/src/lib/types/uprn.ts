import type { SvelteSet } from 'svelte/reactivity';

/**
 * A selection of data fields from a specific layer.
 */
export interface DataSelection {
	/** The ID of the layer this selection belongs to */
	layerId: string;
	/** A human-readable name for the selection, typically the layer's name */
	name: string;
	/** A set of field names selected from the layer */
	fields: SvelteSet<string>;
}
