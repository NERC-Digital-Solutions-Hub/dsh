/**
 * Represents a single row from the dataset/variable table.
 *
 * Use this type when consuming data where the keys match the source columns exactly
 * (e.g. CSV headers, SQL results, etc.).
 */
export type DatasetVariableRowRaw = {
	DbId: number;
	WmId: string;
	WmTitle: string;
	WmLayerType: string;
	WmItemId: string;
	WmUrl: string;
	DatasetName: string | null;
	TvType: string;
	TvPath: string;
	Order: number;
	VariableName: string;
	VariableLabel: string;
	HasDependants: string[] | null;
	IsListed: boolean;
	IsEnabled: boolean;
	DefaultExported: boolean | null;
	TvFieldPath: string | null;
	TvTags: string | null;
	TvMetadataUrl: string | null;
	TreeviewId: string | null;
	VisibilityGroupId: number | null;
	IsOpenOnInit: boolean;
	IsVisibleOnInit: boolean;
	DisableVisibility: boolean;
	AlternativeTitle: string | null;
	MetadataTabInfoUrl: string | null;
};

/**
 * Camel-cased representation of {@link DatasetVariableRowRaw} for use within the app.
 */
export type DatasetVariableRow = {
	dbId: number;
	wmId: string;
	wmTitle: string;
	wmLayerType: string;
	wmItemId: string;
	wmUrl: string;
	datasetName: string | null;
	tvType: string;
	tvPath: string;
	order: number;
	variableName: string;
	variableLabel: string;
	hasDependants: string[] | null;
	isListed: boolean;
	isEnabled: boolean;
	defaultExported: boolean | null;
	tvFieldPath: string | null;
	/**
	 * Tags as delivered by the source.
	 * If/when the API formalizes tag structure, we can change this to `string[]`.
	 */
	tvTags: string | null;
	tvMetadataUrl: string | null;
	treeviewId: string | null;
	visibilityGroupId: number | null;
	isOpenOnInit: boolean;
	isVisibleOnInit: boolean;
	disableVisibility: boolean;
	alternativeTitle: string | null;
	metadataTabInfoUrl: string | null;
};

/**
 * Represents a single row from the dataset table.
 */
export type DatasetRowRaw = {
	DbId: number;
	WmId: string;
	WmTitle: string;
	WmLayerType: string;
	WmItemId: string;
	WmUrl: string;
	DatasetName: string | null;
	HasDependants: string[] | null;
	IsListed: boolean;
	IsEnabled: boolean;
	TvType: string;
	TvPath: string;
	Order: number;
	MetadataId: string | null;
	MetadataUrl: string | null;
	TreeviewId: string | null;
	VisibilityGroupId: number | null;
	IsOpenOnInit: boolean;
	IsVisibleOnInit: boolean;
	DisableVisibility: boolean;
	AlternativeTitle: string | null;
	MetadataTabInfoUrl: string | null;
};

/**
 * Camel-cased representation of {@link DatasetRowRaw} for use within the app.
 */
export type DatasetRow = {
	dbId: number;
	wmId: string;
	wmTitle: string;
	wmLayerType: string;
	wmItemId: string;
	wmUrl: string;
	datasetName: string | null;
	hasDependants: string[] | null;
	isListed: boolean;
	isEnabled: boolean;
	tvType: string;
	tvPath: string;
	order: number;
	metadataId: string | null;
	metadataUrl: string | null;
	treeviewId: string | null;
	visibilityGroupId: number | null;
	isOpenOnInit: boolean;
	isVisibleOnInit: boolean;
	disableVisibility: boolean;
	alternativeTitle: string | null;
	metadataTabInfoUrl: string | null;
};
