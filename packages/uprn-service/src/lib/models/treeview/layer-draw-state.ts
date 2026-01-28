/**
 * Enumeration of possible draw states for a layer.
 * Used to represent if a layer is currently visible on the map.
 */
export enum LayerDrawState {
	/** Layer is not visible on the map. */
	Hidden = 'hidden',

	/** Layer is ABLE TO be visible on the map but not yet visible. E.g. if LOD is not met, the layer has suspended visibility. */
	Suspended = 'suspended',

	/** Layer is currently visible on the map. */
	Visible = 'visible'
}
