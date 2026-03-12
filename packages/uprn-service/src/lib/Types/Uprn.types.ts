import type { SvelteSet } from 'svelte/reactivity';

export interface UprnConfiguration {
	contentConfig: ContentConfig;
	uprnDownloadApiConfig: ConfigurationItemInfo;
	aiUprnChatbotApiConfig: ConfigurationItemInfo;
	mapsConfig: ConfigurationItemInfo[];
	mainSidebarSizes?: SidebarSize[];
}

export type ContentConfig = {
	baseUrl: string;
	manifestPath: string;
	climateJustRenderersPath: string;
	introductionPath: string;
	chatbotConfigPath: string;
};

export interface SidebarSize {
	breakpoint: number;
	originalSize: string;
	minSize: string;
}

export interface ConfigurationItemInfo {
	itemType: 'url' | 'file';
	path: string;
}

export enum TabType {
	AreaOfInterest = 'area',
	Data = 'data',
	Export = 'export',
	Downloads = 'downloads'
}

/**
 * A selection of data fields from a specific layer.
 */
export interface DataSelection {
	/** The ID of the layer this selection belongs to */
	layerId: string;
	layer: __esri.Layer | __esri.Sublayer;
	/** A set of field names selected from the layer */
	fields: SvelteSet<string>;
}

export interface AreaSelectionInfo {
	layerId: string;
	areaFieldInfos: AreaFieldInfo[];
}

export interface AreaFieldInfo {
	id: number;
}

export interface AreaSelectionInfoWithCode {
	layerId: string;
	areaFieldInfos: AreaFieldInfoWithCode[];
}

export interface AreaFieldInfoWithCode {
	id: number;
	code: string;
}

export interface DataSelectionInfo {
	layerId: string;
	fields: string[];
}

/**
 * Enumeration of possible download statuses.
 * Used to track the status of data downloads.
 */
export const DownloadStatus = Object.freeze({
	Pending: 'pending',
	Submitted: 'submitted',
	Queued: 'queued',
	InProgress: 'in-progress',
	Completed: 'completed',
	Failed: 'failed'
});

/** Type representing the possible download statuses. */
export type DownloadStatus = (typeof DownloadStatus)[keyof typeof DownloadStatus];

export const JobStatusType = Object.freeze({
	Submitted: 'SUBMITTED',
	Queued: 'QUEUED',
	Processing: 'IN_PROGRESS',
	Completed: 'COMPLETED',
	Error: 'ERROR'
});

export type JobStatusType = (typeof JobStatusType)[keyof typeof JobStatusType];

/**
 * An entry representing a download task.
 * Includes the unique ID and current status of the download.
 * Used in the DownloadsStore to manage user downloads.
 */
export type DownloadDisplayInfoNode = {
	id: string;
	name: string;
	isVariable: boolean;
	isLeaf: boolean;
	children: DownloadDisplayInfoNode[];
	typology?: string;
};

export type DownloadDisplayInfo = {
	areaTree: DownloadDisplayInfoNode[];
	dataTree: DownloadDisplayInfoNode[];
};

export type DownloadEntry = {
	localId: string;
	externalId?: string;
	status: DownloadStatus;
	errorMessage?: string;
	fileSize?: number;
	areaSelection: AreaSelectionInfoWithCode;
	dataSelections: DataSelectionInfo[];
	displayInfo?: DownloadDisplayInfo;
};

export type UprnDownloadEndpoints = {
	__name?: string;
	baseUrl: string;
	healthRoute: string;
	requestJobRoute: string;
	requestJobStatusesRoute: string;
	getAreaSelectionLimitsRoute: string;
	fetchDownloadRoute: string;
};

export type UprnDownloadHealthResponse = {
	status: EndpointHealthStatus;
	uptime: number;
};

export const EndpointHealthStatus = Object.freeze({
	ok: 'ok'
});

export type EndpointHealthStatus = (typeof EndpointHealthStatus)[keyof typeof EndpointHealthStatus];

export type UrpnDownloadAreaSelectionLimitResponse = {
	layerName: string;
	index: number;
	areaLimit: number;
};

export type UprnDownloadJobRequest = {
	exports: UprnDownloadJobRequestExport;
};

export type UprnDownloadJobRequestExport = {
	areaSelectionLayer: UprnDownloadJobRequestAreaSelectionLayer;
	dataSelectionLayers: UprnDownloadJobRequestDataSelectionLayer[];
};

export type UprnDownloadJobRequestAreaSelectionLayer = {
	remoteId: string;
	areas: string[];
};

export type UprnDownloadJobRequestDataSelectionLayer = {
	remoteId: string;
	fields: string[];
};

export type UprnDownloadJobRequestResponse = {
	type: JobRequestResponseType;
	guid: string;
	message?: string;
	queueId: number;
	queuePosition: number;
};

export const JobRequestResponseType = Object.freeze({
	Success: 'success',
	Error: 'error'
});

export type JobRequestResponseType =
	(typeof JobRequestResponseType)[keyof typeof JobRequestResponseType];

export type UprnDownloadGetJobStatusesRequest = {
	jobs: string[];
};

export type UprnDownloadQueueStatus = {
	current: number;
	total: number;
};

export type UprnDownloadJobStatus = {
	type: JobStatusType;
	fileSize: number | undefined;
	message: string | undefined;
	queueId: number;
	queuePosition: number;
};

export type UprnDownloadJobStatusItem = {
	guid: string; // UUID
	status: UprnDownloadJobStatus;
	queueId: number;
	queuePosition: number;
};

export type UprnDownloadGetJobStatusesResponse = {
	queue: UprnDownloadQueueStatus;
	jobs: UprnDownloadJobStatusItem[];
};

export type UprnDownloadErrorResponse = {
	error: string;
};

export type UprnDownloadGetJobStatusesResult =
	| UprnDownloadGetJobStatusesResponse
	| UprnDownloadErrorResponse;

export type AiUprnChatbotEndpoints = {
	__name?: string;
	baseUrl: string;
	healthRoute: string;
	chatRoute: string;
	chatStreamRoute: string;
	feedbackRoute: string;
};

export type AiUprnChatbotHealthResponse = {
	status: EndpointHealthStatus;
	uptime: number;
};

export type AiUprnChatbotRequest = {
	query: string;
};

export type AiUprnChatbotResponse = {
	response: string;
};

/** The progress states for a tab. */
export enum TabProgress {
	NotStarted = 'not-started',
	InProgress = 'in-progress',
	Completed = 'completed'
}

/**
 * The type of selection - either a layer or a field.
 */
export enum SelectionType {
	/**
	 * The selection is a layer.
	 */
	Layer = 'layer',

	/**
	 * The selection is a field within a layer.
	 */
	Field = 'field'
}

/**
 * The selection information for the user state.
 */
export type UserStateSelection = {
	name: string;
	type: SelectionType;
	selectedChildren: UserStateSelection[];
};

/**
 * The user state information for the UPRN service.
 */
export type UserState = {
	currentTab: string;
	areaSelection: UserStateSelection | null;
	dataSelections: UserStateSelection[];
};

/**
 * Manifest produced by the Excel → CSV export workflow.
 *
 * It describes:
 * - the source Excel workbook that was processed
 * - the generated CSV files (one per sheet)
 * - a monotonically increasing version number (as defined by your generator)
 */
export type UprnServiceConfigManifest = {
	/**
	 * Manifest schema/version for consumers.
	 *
	 * This is incremented by the generator when it detects a meaningful change
	 * (in your current implementation: when the source Excel file's sha256 changes).
	 */
	version: number;

	/**
	 * Repository-relative directory where CSV outputs are written.
	 *
	 * Example: "pages/apps/uprn-service/generated/csv"
	 */
	generated_dir: string;

	/**
	 * Information about the source Excel workbook used to generate the CSV outputs.
	 */
	source: {
		/**
		 * Repository-relative path to the Excel workbook.
		 *
		 * Example: "pages/apps/uprn-service/config.xlsx"
		 */
		path: string;

		/**
		 * SHA-256 hash of the source workbook file bytes.
		 *
		 * Used to detect whether the workbook has changed between runs.
		 * Hex-encoded (64 characters).
		 */
		sha256: string;
	};

	/**
	 * CSV outputs generated from each sheet in the workbook.
	 *
	 * Each entry corresponds to a single worksheet.
	 */
	output: Array<{
		/**
		 * The original worksheet name in the Excel workbook.
		 *
		 * Example: "datasets"
		 */
		sheet_name: string;

		/**
		 * Repository-relative path to the generated CSV file for this sheet.
		 *
		 * Example: "pages/apps/uprn-service/generated/csv/config/datasets.csv"
		 */
		csv_path: string;

		/**
		 * SHA-256 hash of the generated CSV file bytes.
		 *
		 * Useful for integrity checking and detecting changes to a specific sheet's output.
		 * Hex-encoded (64 characters).
		 */
		sha256: string;
	}>;
};
