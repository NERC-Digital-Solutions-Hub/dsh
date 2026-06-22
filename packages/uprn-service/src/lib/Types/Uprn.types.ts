import type { SvelteSet } from 'svelte/reactivity';

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
	Downloads = 'download'
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
	isDownloaded: boolean;
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

export type UprnDownloadAreaSelectionLimitRequest = {
	portalItemId: string;
	layers: string[];
};

export type UrpnDownloadAreaSelectionLimitResponse = {
	layers: UprnDownloadAreaSelectionLimit[];
};

export type UprnDownloadAreaSelectionLimit = {
	layerId: string;
	areaLimit: number;
};

export type UprnDownloadJobRequest = {
	portalItemId: string;
	area: UprnDownloadJobRequestAreaSelectionLayer;
	data: UprnDownloadJobRequestDataSelectionLayer[];
};

export type UprnDownloadJobRequestAreaSelectionLayer = {
	id: string;
	selections: string[];
};

export type UprnDownloadJobRequestDataSelectionLayer = {
	id: string;
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
