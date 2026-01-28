/**
 * Enumeration of possible selection states for a node.
 */
export enum SelectionState {
	/** Node is not selected for download. */
	Inactive = 'inactive',
	/** Node is partially selected (some children selected). */
	Indeterminate = 'indeterminate',
	/** Node is fully selected for download. */
	Active = 'active'
}