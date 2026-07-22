import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
import {
	type TreeviewConfig,
	type TreeviewNodeConfig,
	type VisibilityGroupConfig
} from '$lib/types/treeview.types';

/**
 * Type representing a tag and its associated count.
 */
/**
 * Store class that manages treeview configuration data and provides efficient access to items and visibility groups.
 * Uses Map-based lookups for O(1) access time to configuration objects by their IDs.
 *
 * This class encapsulates the configuration data and provides a clean API for accessing
 * treeview items and visibility groups without exposing the internal data structures.
 */
export class TreeviewConfigStore implements INodeConfigProvider {
	/** Array storing all treeview node configurations */
	public configs: TreeviewNodeConfig[] = [];

	/** Map for fast O(1) lookup of treeview node configurations by their ID */
	#configLookup: Map<string, TreeviewNodeConfig> = new Map();

	/** Array storing all visibility group configurations */
	#visibilityGroups: VisibilityGroupConfig[] = [];

	/** Map for fast O(1) lookup of visibility groups by their ID */
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

		this.configs = config.layers ?? [];
		this.#configLookup = this.createConfigLookup(this.configs);

		this.#visibilityGroups = config.visibilityGroups ?? [];
		this.#visibilityGroupsLookup = new Map(
			this.#visibilityGroups.map((group) => [group.id, group])
		);
	}

	private createConfigLookup(configs: TreeviewNodeConfig[]): Map<string, TreeviewNodeConfig> {
		const lookup = new Map<string, TreeviewNodeConfig>();

		const walk = (nodes: TreeviewNodeConfig[]) => {
			for (const node of nodes) {
				lookup.set(node.id, node);
				if (node.children?.length) {
					walk(node.children);
				}
			}
		};

		walk(configs);
		return lookup;
	}

	/**
	 * Retrieves the configuration for a specific treeview item by its ID.
	 *
	 * @param id - The unique identifier of the treeview item to retrieve
	 * @returns The treeview item configuration if found, undefined otherwise
	 */
	public getConfig(id: string): TreeviewNodeConfig | undefined {
		return this.#configLookup.get(id);
	}

	/**
	 * Retrieves the configuration for a specific visibility group by its ID.
	 *
	 * @param id - The unique identifier of the visibility group to retrieve
	 * @returns The visibility group configuration if found, undefined otherwise
	 */
	public getVisibilityGroupConfig(id: string): VisibilityGroupConfig | undefined {
		return this.#visibilityGroupsLookup.get(id);
	}

	/**
	 * Add a new treeview item configuration to the store.
	 * @param item The node config to add.
	 */
	public addItemConfig(item: TreeviewNodeConfig): void {
		if (this.#configLookup.has(item.id)) {
			throw new Error(`Item with id ${item.id} already exists.`);
		}

		this.configs.push(item);
		this.#configLookup.set(item.id, item);
	}

	/**
	 * Remove a treeview item configuration from the store.
	 * @param item The item to remove from the store.
	 */
	public removeItemConfig(item: TreeviewNodeConfig): void {
		if (!this.#configLookup.has(item.id)) {
			return;
		}

		this.configs = this.configs.filter((config) => config.id !== item.id);
		this.#configLookup.delete(item.id);
	}
}
