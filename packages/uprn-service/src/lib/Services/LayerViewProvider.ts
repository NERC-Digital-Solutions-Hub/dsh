/**
 * Service to provide layer views for given layers in a map view. This enables the ability to fetch views without having to
 * expose the map view throughout the application.
 */
export class LayerViewProvider {
	#mapView: __esri.MapView;

	/**
	 * Initializes the LayerViewProvider with the given map view.
	 * @param mapView The map view instance.
	 */
	constructor(mapView: __esri.MapView) {
		this.#mapView = mapView;
	}

	/**
	 *
	 * @param layer The layer to get the layer view of.
	 * @returns The layer view of the provided layer.
	 */
	public async getLayerView(layer: __esri.Layer): Promise<__esri.LayerView | undefined> {
		return await this.#mapView.whenLayerView(layer);
	}

	/**
	 * Gets a layer from the underlying map without waiting for it to render.
	 * @param layerId The ID of the layer to retrieve.
	 * @returns The layer with the provided ID, if it exists in the map.
	 */
	public getLayerById(layerId: string): __esri.Layer | undefined {
		return this.#mapView.map?.findLayerById(layerId) ?? undefined;
	}

	/**	 *
	 * @param layerId The ID of the layer to get the layer view of.
	 * @returns The layer view of the layer with the provided ID.
	 */
	public async getLayerViewById(layerId: string): Promise<__esri.LayerView | undefined> {
		const layer = this.getLayerById(layerId);
		if (!layer) {
			return undefined;
		}

		return await this.getLayerView(layer);
	}
}
