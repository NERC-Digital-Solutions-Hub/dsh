import type { AreaSelectionInfo } from '$lib/Types/Uprn.types';

/**
 * Interface that provides the area selection information.
 */
export interface IAreaSelectionProvider {
	/**
	 * Get the current area selection.
	 * @return The current area selection or null if no layer is selected.
	 */
	getAreaSelection(): AreaSelectionInfo | null;
}
