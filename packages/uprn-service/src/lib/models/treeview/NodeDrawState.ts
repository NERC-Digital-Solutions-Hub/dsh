/**
 * Enumeration of possible draw states for a node.
 * Used to represent if a node is currently visible on the map.
 */
export enum NodeDrawState {
	/** Node is not visible on the map. */
	Hidden = 'hidden',

	/** Node is ABLE TO be visible on the map but not yet visible. E.g. if LOD is not met, the node has suspended visibility. */
	Suspended = 'suspended',

	/** Node is currently visible on the map. */
	Visible = 'visible'
}
