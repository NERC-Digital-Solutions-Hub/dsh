/**
 * Configuration for a visibility group that controls how many layers can be visible simultaneously.
 * Visibility groups are used to enforce mutual exclusivity or limit the number of visible layers
 * within a specific group to improve performance and user experience.
 */
export interface VisibilityGroupConfig {
	/** Unique identifier for the visibility group */
	id: string;
	/** Maximum number of layers that can be visible at the same time within this group */
	maxVisibleLayers: number;
}

/*
 * Configuration for an inheritance group that defines properties inherited by child nodes.
 */
export interface InheritanceGroupConfig {
	/** Unique identifier for the inheritance group */
	id: string;
	/** List of properties that child nodes will inherit from this group */
	inheritedProperties: string[];
}

/**
 * Main configuration object for the treeview component.
 * Contains all the configuration data needed to set up treeview items and their visibility rules.
 */
export interface TreeviewConfig {
	/** Array of treeview layer configurations. Optional - defaults to empty array if not provided */
	layers?: TreeviewNodeConfig[];
	/** Array of visibility group configurations. Optional - defaults to empty array if not provided */
	visibilityGroups?: VisibilityGroupConfig[];
	/** List of field names to hide from display in the treeview. Optional - defaults to no hidden fields if not provided */
	fieldsToHide?: string[];
}

/**
 * Configuration for an individual node in the treeview.
 * Defines the properties and behavior of a single treeview node, including visibility rules,
 * download capabilities, and dependencies on other node.
 */
export interface TreeviewNodeConfig {
	/** Unique identifier for the treeview node */
	id: string;

	/** Optional name for configuration management */
	name?: string;

	/** Display name for the treeview node to be shown in the user interface */
	displayName?: string;

	/** Type of the treeview node, e.g., 'group-layer' */
	type: TreeviewNodeLayerType;

	/** Type of treeview a node belongs to - area selection or data selection. */
	treeviewType?: TreeviewType;

	/** Typology classification for the treeview node to define its role and characteristics */
	typology?: TreeviewNodeTypology;

	/** Optional array of tags associated with this node for categorisation or filtering */
	tags?: string[];

	/** Whether this node can be downloaded by the user. Optional - defaults to false if not specified */
	isDownloadable?: boolean;

	/** Whether this node is visible on initialisation. Optional - defaults to false if not specified */
	isVisibleOnInit?: boolean;

	/** Whether this node should be hidden from the user interface AND have its layer visibility set to false. Optional - defaults to false if not specified */
	isHidden?: boolean;

	/** Whether this node can have its layer visibility changed. Optional - defaults to false if not specified */
	disableVisibilityToggle?: boolean;

	/** Whether this node is expanded/open on initialisation. Optional - defaults to false if not specified */
	isOpenOnInit?: boolean;

	/** Order index to determine the position of this node among its siblings. Optional - defaults to undefined if not specified */
	order?: number;

	/** Whether fields under this node should be shown in the user interface. Optional - defaults to false if not specified */
	showFields?: boolean;

	/** Array of node IDs that this node depends on for visibility. Optional - no dependencies if not specified */
	visibilityDependencyIds?: string[];

	/** ID of the visibility group this node belongs to. Optional - node not part of any group if not specified */
	visibilityGroupId?: string;

	/** Optional ID of a custom converter to use for this node, if applicable */
	customConverterId?: string;

	/** Optional URL to fetch metadata for this node */
	arcGisMetadataUrl?: string;

	/** Optional URL to the metadata tab info */
	metadataTabInfoUrl?: string;

	/** Optional layer ID associated with this node, used for controlling visibility in the map view */
	layerId?: string;

	/** Optional variable ID associated with this node, used for controlling visibility in the map view */
	variableId?: string;

	/** The child nodes of this treeview node, allowing for hierarchical structures. */
	children?: TreeviewNodeConfig[];
}

export enum TreeviewNodeLayerType {
	None = 'none',
	GroupLayer = 'group-layer',
	FeatureLayer = 'feature-layer',
	TileLayer = 'tile-layer',
	MapImageLayer = 'map-image-layer',
	Field = 'field'
}

/**
 * Typology classifications for treeview nodes to define their roles and characteristics.
 */
export enum TreeviewNodeTypology {
	Folder = 'folder',
	DatasetRaster = 'dataset-raster',
	DatasetVector = 'dataset-vector',
	Variable = 'variable',
	Area = 'area'
}

/**
 * Type of treeview a node belongs to - area selection or data selection.
 */
export enum TreeviewType {
	Area = 'area',
	Data = 'data'
}
