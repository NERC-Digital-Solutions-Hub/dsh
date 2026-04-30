/**
 * Represents a single row from the dataset/variable table.
 *
 * Use this type when consuming data where the keys match the source columns exactly
 * (e.g. CSV headers, SQL results, etc.).
 */
export type DatasetVariableRowRaw = {
	DbId: number;
	DatasetName: string | null;
	Order: number;
	TvVariableName: string;
	TvVariableLabel: string;
	HasDependants: string[] | null;
	IsListed: boolean;
	IsEnabled: boolean;
	DefaultExported: boolean | null;
	TvVariablePath: string | null;
	TvTags: string | null;
	TvMetadataConfigUrl: string | null;
	TreeviewId: number | null;
	VisibilityGroupId: number | null;
	IsOpenOnInit: boolean;
	IsRenderedOnInit: boolean;
	DisableRendering: boolean;
	DisabledReason: string | null;
	AlternativeTitle: string | null;
	MetadataTabInfoUrl: string | null;
};

/**
 * Camel-cased representation of {@link DatasetVariableRowRaw} for use within the app.
 */
export type DatasetVariableRow = {
	dbId: number;
	datasetName: string | null;
	order: number;
	tvVariableName: string;
	tvVariableLabel: string;
	hasDependants: string[] | null;
	isListed: boolean;
	isEnabled: boolean;
	defaultExported: boolean | null;
	tvVariablePath: string | null;
	/**
	 * Tags as delivered by the source.
	 * If/when the API formalizes tag structure, we can change this to `string[]`.
	 */
	tvTags: string | null;
	tvMetadataConfigUrl: string | null;
	treeviewId: number | null;
	visibilityGroupId: number | null;
	isOpenOnInit: boolean;
	isRenderedOnInit: boolean;
	disableRendering: boolean;
	disabledReason: string | null;
	alternativeTitle: string | null;
	metadataTabInfoUrl: string | null;
};

/**
 * Represents a single row from the dataset table.
 */
export type DatasetRowRaw = {
	DbId: number;
	WmId: string;
	TvTitle: string;
	WmLayerType: number;
	WmItemId: string;
	WmUrl: string;
	DatasetName: string | null;
	HasDependants: string[] | null;
	IsListed: boolean;
	IsEnabled: boolean;
	TvType: number;
	TvPath: string;
	Order: number;
	MetadataId: string | null;
	MetadataConfigUrl: string | null;
	TreeviewId: number | null;
	VisibilityGroupId: number | null;
	IsOpenOnInit: boolean;
	IsRenderedOnInit: boolean;
	DisableRendering: boolean;
	DisabledReason: string | null;
};

/**
 * Camel-cased representation of {@link DatasetRowRaw} for use within the app.
 */
export type DatasetRow = {
	dbId: number;
	wmId: string;
	tvTitle: string;
	wmLayerType: number;
	wmItemId: string;
	wmUrl: string;
	datasetName: string | null;
	hasDependants: string[] | null;
	isListed: boolean;
	isEnabled: boolean;
	tvType: number;
	tvPath: string;
	order: number;
	metadataId: string | null;
	metadataConfigUrl: string | null;
	treeviewId: number | null;
	visibilityGroupId: number | null;
	isOpenOnInit: boolean;
	isRenderedOnInit: boolean;
	disableRendering: boolean;
	disabledReason: string | null;
};

/**
 * Represents a single row from the folder table.
 */
export type FolderRowRaw = {
	DbId: number;
	FolderName: string | null;
	IsListed: boolean;
	IsEnabled: boolean;
	TvPath: string;
	TvTitle: string | null;
	Order: number;
	MetadataConfigUrl: string | null;
	TreeviewId: number | null;
	IsOpenOnInit: boolean;
	DisabledReason: string | null;
	Description: string | null;
};

/**
 * Camel-cased representation of {@link FolderRowRaw} for use within the app.
 */
export type FolderRow = {
	dbId: number;
	folderName: string | null;
	isListed: boolean;
	isEnabled: boolean;
	tvPath: string;
	tvTitle: string | null;
	order: number;
	metadataConfigUrl: string | null;
	treeviewId: number | null;
	isOpenOnInit: boolean;
	disabledReason: string | null;
	description: string | null;
};
