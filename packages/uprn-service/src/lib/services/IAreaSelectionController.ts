/**
 * Interface that controls the handling of the area selection information.
 */
export interface IAreaSelectionController {
	readonly layerId: string | null;
	readonly areaIds: Set<number>;

	/**
	 * Set the layer ID for area selection.
	 * @param layerId - The ID of the layer
	 */
	setAreaSelectionLayer(layerId: string | null): void;

	/**
	 * Add an area ID to the selected areas.
	 * @param areaId - The area ID to add
	 */
	addAreaSelection(areaId: number): void;
}
