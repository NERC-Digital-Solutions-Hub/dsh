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

/**
 * Main configuration object for the treeview component.
 * Contains all the configuration data needed to set up treeview items and their visibility rules.
 */
export interface TreeviewConfig {
	/** Array of treeview item configurations. Optional - defaults to empty array if not provided */
	items?: TreeviewItemConfig[];
	/** Array of visibility group configurations. Optional - defaults to empty array if not provided */
	visibilityGroups?: VisibilityGroupConfig[];
}

/**
 * Configuration for an individual item in the treeview.
 * Defines the properties and behavior of a single treeview node, including visibility rules,
 * download capabilities, and dependencies on other items.
 */
export interface TreeviewItemConfig {
	/** Unique identifier for the treeview item */
	id: string;
	/** Whether this item can be downloaded by the user. Optional - defaults to false if not specified */
	isDownloadable?: boolean;
	/** Whether this item is currently visible. Optional - defaults to false if not specified */
	isVisible?: boolean;
	/** Whether this item should be hidden from the user interface. Optional - defaults to false if not specified */
	isHidden?: boolean;
	/** Array of item IDs that this item depends on for visibility. Optional - no dependencies if not specified */
	visibilityDependencyIds?: string[];
	/** ID of the visibility group this item belongs to. Optional - item not part of any group if not specified */
	visibilityGroupId?: string;
}
