import type { AreaSelectionInfoWithCode, DataSelectionInfo } from './selection.types';

export const DownloadStatus = Object.freeze({
	Pending: 'pending',
	Submitted: 'submitted',
	Queued: 'queued',
	InProgress: 'in-progress',
	Completed: 'completed',
	Failed: 'failed'
});

export type DownloadStatus = (typeof DownloadStatus)[keyof typeof DownloadStatus];

export const JobStatusType = Object.freeze({
	Submitted: 'SUBMITTED',
	Queued: 'QUEUED',
	Processing: 'IN_PROGRESS',
	Completed: 'COMPLETED',
	Error: 'ERROR'
});

export type JobStatusType = (typeof JobStatusType)[keyof typeof JobStatusType];

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

export type UprnDownloadAreaSelectionLimitRequest = {
	portalItemId: string;
	layers: string[];
};

export type UprnDownloadAreaSelectionLimitResponse = {
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

export const JobRequestResponseType = Object.freeze({
	Success: 'success',
	Error: 'error'
});

export type JobRequestResponseType =
	(typeof JobRequestResponseType)[keyof typeof JobRequestResponseType];

export type UprnDownloadJobRequestResponse = {
	type: JobRequestResponseType;
	guid: string;
	message?: string;
	queueId: number;
	queuePosition: number;
};

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
	guid: string;
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
