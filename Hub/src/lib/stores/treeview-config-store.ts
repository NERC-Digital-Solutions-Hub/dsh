import {
	type TreeviewConfig,
	type TreeviewItemConfig,
	type VisibilityGroupConfig
} from '$lib/types/treeview';

/**
 * Store class that manages treeview configuration data and provides efficient access to items and visibility groups.
 * Uses Map-based lookups for O(1) access time to configuration objects by their IDs.
 *
 * This class encapsulates the configuration data and provides a clean API for accessing
 * treeview items and visibility groups without exposing the internal data structures.
 */
export class TreeviewConfigStore {
	/** Private array storing all treeview item configurations */
	#items: TreeviewItemConfig[] = [];
	/** Private Map for fast O(1) lookup of treeview items by their ID */
	#itemsLookup: Map<string, TreeviewItemConfig> = new Map();

	/** Private array storing all visibility group configurations */
	#visibilityGroups: VisibilityGroupConfig[] = [];
	/** Private Map for fast O(1) lookup of visibility groups by their ID */
	#visibilityGroupsLookup: Map<string, VisibilityGroupConfig> = new Map();

	/**
	 * Creates a new TreeviewConfigStore instance with the provided configuration.
	 *
	 * @param config - The treeview configuration object containing items and visibility groups
	 */
	constructor(config: TreeviewConfig) {
		if (!config) {
			throw new Error('TreeviewConfigStore requires a valid configuration object.');
		}

		this.#items = config.items ?? [];
		this.#itemsLookup = new Map(this.#items.map((item) => [item.id, item]));

		this.#visibilityGroups = config.visibilityGroups ?? [];
		this.#visibilityGroupsLookup = new Map(
			this.#visibilityGroups.map((group) => [group.id, group])
		);
	}

	/**
	 * Retrieves the configuration for a specific treeview item by its ID.
	 *
	 * @param id - The unique identifier of the treeview item to retrieve
	 * @returns The treeview item configuration if found, undefined otherwise
	 */
	getItemConfig(id: string): TreeviewItemConfig | undefined {
		return this.#itemsLookup.get(id);
	}

	addItemConfig(item: TreeviewItemConfig): void {
		if (this.#itemsLookup.has(item.id)) {
			throw new Error(`Item with id ${item.id} already exists.`);
		}

		this.#items.push(item);
		this.#itemsLookup.set(item.id, item);
	}

	/**
	 * Retrieves the configuration for a specific visibility group by its ID.
	 *
	 * @param id - The unique identifier of the visibility group to retrieve
	 * @returns The visibility group configuration if found, undefined otherwise
	 */
	getVisibilityGroupConfig(id: string): VisibilityGroupConfig | undefined {
		return this.#visibilityGroupsLookup.get(id);
	}
}
