import type { IAreaSelectionController } from '$lib/Services/IAreaSelectionController';
import type { AreaSelectionInfo } from '$lib/Types/Uprn.types';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Snapshot type for AreaSelectionStore.
 */
export type AreaSelectionStoreSnapshot = {
	/**
	 * The ID of the layer from which areas are selected.
	 */
	nodeId: string | null;

	/**
	 * Set of selected area IDs. This is the field ID of the area in the feature layer.
	 */
	areaIds: SvelteSet<number>;
};

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
	public exportSnapshot(): AreaSelectionStoreSnapshot {
		return {
			nodeId: this.layerId,
			areaIds: new SvelteSet(this.areaIds)
		};
	}

	/** @inheritdoc */
	public getAreaSelection(): AreaSelectionInfo | null {
		const snapshot = this.exportSnapshot();
		return snapshot.nodeId
			? {
					layerId: snapshot.nodeId,
					areaFieldInfos: Array.from(snapshot.areaIds).map((id) => ({ id }))
				}
			: null;
	}
}
