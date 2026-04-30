export type ContentEnvironment = string;

export type HubSettings = {
	enableIntroductionPopup: boolean;
};

export type ChatbotRemoteConfig = {
	initialMessage: string;
	exampleQuestions: string[];
};

export type UprnSettings = {
	enableIntroductionPopup: boolean;
	chatbot: ChatbotRemoteConfig;
};

export interface VisibilityGroupConfig {
	id: string;
	maxVisibleLayers: number;
}

export interface InheritanceGroupConfig {
	id: string;
	inheritedProperties: string[];
}

export interface TreeviewConfig {
	layers?: TreeviewNodeConfig[];
	visibilityGroups?: VisibilityGroupConfig[];
	fieldsToHide?: string[];
}

export interface TreeviewNodeConfig {
	id: string;
	name?: string;
	displayName?: string;
	type: TreeviewNodeLayerType;
	treeviewType?: TreeviewType;
	typology?: TreeviewNodeTypology;
	tags?: string[];
	isEnabled?: boolean;
	disabledReason?: string;
	isVisibleOnInit?: boolean;
	isHidden?: boolean;
	disableVisibilityToggle?: boolean;
	isOpenOnInit?: boolean;
	order?: number;
	showFields?: boolean;
	visibilityDependencyIds?: string[];
	visibilityGroupId?: string;
	customConverterId?: string;
	arcGisMetadataUrl?: string;
	metadataTabInfoUrl?: string;
	layerId?: string;
	variableId?: string;
	children?: TreeviewNodeConfig[];
}

export enum TreeviewNodeLayerType {
	None = 'none',
	GroupLayer = 'group-layer',
	FeatureLayer = 'feature-layer',
	TileLayer = 'tile-layer',
	MapImageLayer = 'map-image-layer',
	Field = 'field'
}

export enum TreeviewNodeTypology {
	Folder = 'folder',
	DatasetRaster = 'dataset-raster',
	DatasetVector = 'dataset-vector',
	Variable = 'variable',
	Area = 'area'
}

export enum TreeviewType {
	Area = 'area',
	Data = 'data'
}

export type UprnTreeviewLayersPayload = {
	version: number;
	layers: TreeviewNodeConfig[];
};
