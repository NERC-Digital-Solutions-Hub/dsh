import {
	TreeviewNodeType,
	type TreeviewConfig,
	type TreeviewNodeConfig,
	type VisibilityGroupConfig
} from '$lib/types/treeview';
import { getLayerTreeviewItemType, getSublayerIdFromParentId } from '$lib/utils/treeview';
import Sublayer from '@arcgis/core/layers/support/Sublayer';

/**
 * Store class that manages treeview configuration data and provides efficient access to items and visibility groups.
 * Uses Map-based lookups for O(1) access time to configuration objects by their IDs.
 *
 * This class encapsulates the configuration data and provides a clean API for accessing
 * treeview items and visibility groups without exposing the internal data structures.
 */
export class TreeviewConfigStore {
	/** Private array storing all treeview node configurations */
	#configs: TreeviewNodeConfig[] = [];

	/** Private Map for fast O(1) lookup of treeview node configurations by their ID */
	#configLookup: Map<string, TreeviewNodeConfig> = new Map();

	/** Private array storing all visibility group configurations */
	#visibilityGroups: VisibilityGroupConfig[] = [];

	/** Private Map for fast O(1) lookup of visibility groups by their ID */
	#visibilityGroupsLookup: Map<string, VisibilityGroupConfig> = new Map();

	/** Set of field names to hide from display in the treeview */
	#fieldsToHide: Set<string> = new Set<string>();

	/**
	 * Creates a new TreeviewConfigStore instance with the provided configuration.
	 *
	 * @param config - The treeview configuration object containing items and visibility groups
	 */
	constructor(config: TreeviewConfig) {
		if (!config) {
			throw new Error('TreeviewConfigStore requires a valid configuration object.');
		}

		console.log('[TreeviewConfigStore] Initializing with config:', config);
		this.#configs = config.layers ?? [];
		this.#configLookup = new Map(this.#configs.map((item) => [item.id, item]));

		this.#visibilityGroups = config.visibilityGroups ?? [];
		this.#visibilityGroupsLookup = new Map(
			this.#visibilityGroups.map((group) => [group.id, group])
		);

		if (config.fieldsToHide) {
			this.#fieldsToHide = new Set(config.fieldsToHide.map((field) => field.trim().toLowerCase()));
		}
	}

	/**
	 * Retrieves the configuration for a specific treeview item by its ID.
	 *
	 * @param id - The unique identifier of the treeview item to retrieve
	 * @returns The treeview item configuration if found, undefined otherwise
	 */
	public getItemConfig(id: string): TreeviewNodeConfig | undefined {
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

	public resolveInheritance(layers: __esri.Layer[]): void {
		if (layers.length === 0 || !this.#configs || this.#configs.length === 0) {
			return;
		}

		// resolve inheritance groups
		for (const layer of layers) {
			const config = this.getItemConfig(layer.id);
			this.#resolveLayerInheritance(layer, config);
		}
	}

	/**
	 * Add a new treeview item configuration to the store.
	 * @param item The node config to add.
	 */
	public addItemConfig(item: TreeviewNodeConfig): void {
		if (this.#configLookup.has(item.id)) {
			throw new Error(`Item with id ${item.id} already exists.`);
		}

		this.#configs.push(item);
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

		this.#configs = this.#configs.filter((config) => config.id !== item.id);
		this.#configLookup.delete(item.id);
	}

	#resolveLayerInheritance(
		layer: __esri.Layer | __esri.Sublayer,
		parentNodeConfig?: TreeviewNodeConfig
	): void {
		const nodeConfig: TreeviewNodeConfig = this.#getOrCreateLayerNodeConfig(
			layer,
			parentNodeConfig
		);

		// If the layer is a feature layer and has fields to show, create field nodes
		if (this.#isFeatureLayer(layer) && nodeConfig.showFields) {
			const featureLayer = layer as __esri.FeatureLayer;
			if (!featureLayer.loaded) {
				console.warn(`Layer not loaded: ${layer.id}`);
			}

			for (const field of featureLayer.fields ?? []) {
				this.#getOrCreateFieldNodeConfig(
					this.#getFieldNodeId(featureLayer.id, field.name),
					field.name || field.alias || 'UNKNOWN_NAME',
					nodeConfig
				);
			}
		}

		// If the layer is a group layer, recursively resolve inheritance for its sublayers
		if (this.#isGroupLayer(layer)) {
			const groupLayer = layer as __esri.GroupLayer;
			for (const sublayer of groupLayer.layers.toArray()) {
				this.#resolveLayerInheritance(sublayer, nodeConfig);
			}
		}

		//map image layers can also have sublayers
		if (layer.type === 'map-image') {
			const mapImageLayer = layer as __esri.MapImageLayer;
			for (const sublayer of mapImageLayer.sublayers?.toArray() ?? []) {
				this.#resolveLayerInheritance(sublayer, nodeConfig);
			}
		}
	}

	#getOrCreateLayerNodeConfig(
		layer: __esri.Layer | __esri.Sublayer,
		parentNodeConfig?: TreeviewNodeConfig
	): TreeviewNodeConfig {
		const layerId =
			layer instanceof Sublayer
				? getSublayerIdFromParentId(layer, parentNodeConfig?.id ?? '')
				: layer.id;

		const nodeConfig: TreeviewNodeConfig = this.#getOrCreateNodeConfig(layerId, parentNodeConfig);

		if (nodeConfig.type === TreeviewNodeType.None) {
			nodeConfig.type = getLayerTreeviewItemType(layer);
		}

		return nodeConfig;
	}

	#getOrCreateFieldNodeConfig(
		nodeId: string,
		fieldName: string,
		parentNodeConfig: TreeviewNodeConfig
	): TreeviewNodeConfig {
		const nodeConfig: TreeviewNodeConfig = this.#getOrCreateNodeConfig(nodeId, parentNodeConfig);

		if (nodeConfig.type === TreeviewNodeType.None) {
			nodeConfig.type = TreeviewNodeType.Field;
		}

		if (this.#fieldsToHide.has(fieldName.trim().toLowerCase())) {
			nodeConfig.isHidden = true;
		}

		return nodeConfig;
	}

	/**
	 * gets or creates the node config for a node, falling back to parent config if not defined for certain properties
	 * @param nodeId the node identifier
	 * @param parentNodeConfig the parent node config to fall back to
	 * @returns the node config or undefined if not found
	 */
	#getOrCreateNodeConfig(
		nodeId: string,
		parentNodeConfig?: TreeviewNodeConfig
	): TreeviewNodeConfig {
		let nodeConfig: TreeviewNodeConfig | undefined = this.getItemConfig(nodeId);
		nodeConfig ??= parentNodeConfig?.children?.find((child) => child.id === nodeId);

		nodeConfig = {
			id: nodeId,
			name: nodeConfig?.name,
			type: TreeviewNodeType.None,
			treeviewType: this.#getConfigValue(
				true,
				'treeviewType',
				nodeConfig,
				parentNodeConfig,
				undefined
			),
			typology: this.#getConfigValue(false, 'typology', nodeConfig, parentNodeConfig, undefined),
			isDownloadable: this.#getConfigValue(
				true,
				'isDownloadable',
				nodeConfig,
				parentNodeConfig,
				true
			),
			isVisibleOnInit: this.#getConfigValue(
				false,
				'isVisibleOnInit',
				nodeConfig,
				parentNodeConfig,
				false
			),
			isHidden: this.#getConfigValue(true, 'isHidden', nodeConfig, parentNodeConfig, false),
			disableVisibilityToggle: this.#getConfigValue(
				true,
				'disableVisibilityToggle',
				nodeConfig,
				parentNodeConfig,
				false
			),
			isOpenOnInit: this.#getConfigValue(
				false,
				'isOpenOnInit',
				nodeConfig,
				parentNodeConfig,
				false
			),
			showFields: this.#getConfigValue(false, 'showFields', nodeConfig, parentNodeConfig, false),
			visibilityDependencyIds: this.#getConfigValue(
				false,
				'visibilityDependencyIds',
				nodeConfig,
				parentNodeConfig,
				[]
			),
			visibilityGroupId: this.#getConfigValue(
				true,
				'visibilityGroupId',
				nodeConfig,
				parentNodeConfig,
				undefined
			),
			customConverterId: this.#getConfigValue(
				false,
				'customConverterId',
				nodeConfig,
				parentNodeConfig,
				undefined
			),
			children: nodeConfig?.children ?? []
		};

		this.removeItemConfig(nodeConfig); // remove existing config if present
		this.addItemConfig(nodeConfig);

		return nodeConfig;
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	#getConfigValue(
		inheritProperty: boolean,
		propertyName: keyof TreeviewNodeConfig,
		nodeConfig: TreeviewNodeConfig | undefined,
		parentNodeConfig: TreeviewNodeConfig | undefined,
		defaultValue: any
	): any {
		/* eslint-enable @typescript-eslint/no-explicit-any */
		const value = nodeConfig?.[propertyName];
		if (value !== undefined) {
			return value;
		}

		if (inheritProperty) {
			return parentNodeConfig ? (parentNodeConfig[propertyName] ?? defaultValue) : defaultValue;
		}

		return defaultValue;
	}

	#getFieldNodeId(layerId: string, fieldName: string): string {
		return `${layerId}-${fieldName}`;
	}

	/**
	 * Determines if a layer is a group layer that can contain other layers.
	 * @param layer - The layer to check
	 * @returns True if the layer is a group layer
	 */
	#isGroupLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'group';
	}

	/**
	 * Determines if a layer is a feature layer that can contain fields.
	 * @param layer - The layer to check
	 * @returns True if the layer is a feature layer
	 */
	#isFeatureLayer(layer: __esri.Layer | __esri.Sublayer): boolean {
		return layer.type === 'feature';
	}
}
