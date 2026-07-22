type LayerCollectionLike<T> =
	| T[]
	| {
			forEach?: (callback: (item: T) => void) => void;
			toArray?: () => T[];
	  }
	| null
	| undefined;

type LayerWithUprnResources = __esri.Layer & {
	__uprnParquetVisibilityHandle?: IHandle;
};

/** Removes UPRN-owned watchers from every layer in a web map. */
export function cleanupUprnWebMapLayerResources(webmap: __esri.WebMap): void {
	forEachCollectionItem(webmap.layers, cleanupUprnLayerResources);
}

export function cleanupUprnLayerResources(layer: __esri.Layer | __esri.Sublayer): void {
	removeParquetVisibilityHandle(layer as __esri.Layer);
	if (layer.type === 'group') {
		forEachCollectionItem((layer as __esri.GroupLayer).layers, cleanupUprnLayerResources);
		return;
	}
	if (layer.type === 'map-image') {
		forEachCollectionItem((layer as __esri.MapImageLayer).sublayers, cleanupUprnLayerResources);
		return;
	}
	if ('sublayers' in layer) {
		forEachCollectionItem(layer.sublayers, cleanupUprnLayerResources);
	}
}

export function removeParquetVisibilityHandle(layer: __esri.Layer): void {
	const uprnLayer = layer as LayerWithUprnResources;
	uprnLayer.__uprnParquetVisibilityHandle?.remove();
	delete uprnLayer.__uprnParquetVisibilityHandle;
}

function forEachCollectionItem<T>(
	collection: LayerCollectionLike<T>,
	callback: (item: T) => void
): void {
	if (!collection) return;
	if (Array.isArray(collection)) {
		collection.forEach(callback);
		return;
	}
	if (typeof collection.toArray === 'function') {
		collection.toArray().forEach(callback);
		return;
	}
	collection.forEach?.(callback);
}
