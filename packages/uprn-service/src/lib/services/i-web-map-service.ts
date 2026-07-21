/**
 * Interface for the Web Map Service.
 */
export interface IWebMapService {
	/**
	 * Retrieves a layer by its ID.
	 * @param layerId The layer ID.
	 * @return The layer or sublayer with the specified ID, or null if not found.
	 */
	getLayerById(layerId: string): __esri.Layer | __esri.Sublayer | null;
}
