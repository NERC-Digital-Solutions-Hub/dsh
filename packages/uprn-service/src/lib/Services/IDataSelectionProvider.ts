import type { DataSelectionInfo } from '$lib/Types/Uprn.types';

/**
 * Interface that provides the data selection information.
 */
export interface IDataSelectionProvider {
	/**
	 * Get the current data selections.
	 * @return The current data selections.
	 */
	getDataSelections(): DataSelectionInfo[];
}
