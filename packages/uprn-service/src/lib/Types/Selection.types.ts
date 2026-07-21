/** Serializable snapshot of selected areas for a configured node. */
export type AreaSelectionSnapshot = {
	nodeId: string | null;
	areaIds: Set<number>;
};

/** Serializable snapshot of selected fields for a configured data node. */
export type DataSelectionSnapshot = {
	nodeId: string;
	selectedFieldIds: Set<string>;
};

export type AreaSelectionInfoWithCode = {
	layerId: string;
	areaFieldInfos: AreaFieldInfoWithCode[];
};

export type AreaFieldInfoWithCode = {
	id: number;
	code: string;
};

export type DataSelectionInfo = {
	layerId: string;
	fields: string[];
};

export type AreaSelectionFieldInfo = {
	id: string;
	nameField: string;
	codeField: string;
};

export type SelectionViewState = {
	layerView: __esri.FeatureLayerView | null;
	areaHandles: Map<number, __esri.Handle>;
};

export type AreaFieldHandleInfo = {
	id: number;
	handle: __esri.Handle;
};
