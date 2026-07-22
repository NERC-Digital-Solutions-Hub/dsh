import type { IAreaSelectionController } from '$lib/services/i-area-selection-controller';
import type { AreaSelectionSnapshot } from '$lib/types/selection.types';
import { SvelteSet } from 'svelte/reactivity';

export type AreaSelectionStoreSnapshot = AreaSelectionSnapshot;

/**
 * Store for managing the selected areas.
 */
export class AreaSelectionStore implements IAreaSelectionController {
	/**
	 * The ID of the layer from which areas are selected.
	 */
	public layerId: string | null = $state(null);

	/**
	 * Set of selected area IDs. This is the field ID of the area in the feature layer.
	 */
	public areaIds: SvelteSet<number> = $state(new SvelteSet());

	/**
	 * Set the layer ID for area selection.
	 * @param layerId - The ID of the layer
	 */
	public setAreaSelectionLayer(layerId: string | null): void {
		if (this.layerId === layerId) {
			return;
		}

		this.layerId = layerId;
		this.areaIds.clear();
	}

	/**
	 * Add an area ID to the selected areas.
	 * @param areaId - The area ID to add
	 */
	public addAreaSelection(areaId: number): void {
		this.areaIds.add(areaId);
	}

	/**
	 * Add multiple area IDs to the selected areas.
	 * @param areaIds - Array of area IDs to add
	 */
	public addSelectedAreas(areaIds: number[]): void {
		areaIds.forEach((id) => this.areaIds.add(id));
	}

	/**
	 * Remove an area ID from the selected areas.
	 * @param areaId - The area ID to remove
	 */
	public removeSelectedArea(areaId: number): void {
		this.areaIds.delete(areaId);
	}

	/**
	 * Clear all selected areas.
	 */
	public clearSelectedAreas(): void {
		this.areaIds.clear();
	}

	/**
	 * Export a snapshot of the state of the AreaSelectionStore.
	 * @returns The exported snapshot
	 */
	public exportSnapshot(): AreaSelectionSnapshot {
		return {
			nodeId: this.layerId,
			areaIds: new SvelteSet(this.areaIds)
		};
	}
}
