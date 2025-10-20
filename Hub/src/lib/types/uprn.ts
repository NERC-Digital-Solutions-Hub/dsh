import type { SvelteSet } from 'svelte/reactivity';

/**
 * A selection of data fields from a specific layer.
 */
export interface DataSelection {
	/** The ID of the layer this selection belongs to */
	layerId: string;
	/** A human-readable name for the selection, typically the layer's name */
	name: string;
	/** A set of field names selected from the layer */
	fields: SvelteSet<string>;
}

/**
 * Enumeration of possible download statuses.
 * Used to track the status of data downloads.
 */
export const DownloadStatus = Object.freeze({
	Pending: 'pending',
	InProgress: 'in-progress',
	Completed: 'completed',
	Failed: 'failed'
});

/** Type representing the possible download statuses. */
export type DownloadStatus = (typeof DownloadStatus)[keyof typeof DownloadStatus];

/**
 * An entry representing a download task.
 * Includes the unique ID and current status of the download.
 * Used in the DownloadsStore to manage user downloads.
 */
export type DownloadEntry = {
	id: string;
	status: DownloadStatus;
};

export type UprnDownloadEndpoints = {
	baseUrl: string;
	healthRoute: string;
	requestJobRoute: string;
	getJobStatusesRoute: string;
	getAreaSelectionLimitsRoute: string;
};

export type UprnDownloadHealthResponse = {
	status: UprnDownloadHealthStatus;
	uptime: number;
};

export const UprnDownloadHealthStatuses = Object.freeze({
	ok: 'ok'
});

export type UprnDownloadHealthStatus =
	(typeof UprnDownloadHealthStatuses)[keyof typeof UprnDownloadHealthStatuses];

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
	index: number;
	areas: string[];
};

export type UprnDownloadJobRequestDataSelectionLayer = {
	index: number;
	fields: string[];
};

export type UprnDownloadJobRequestResponse = {
	type: string;
	guid: string;
	message?: string;
};

export type UprnDownloadGetJobStatusesRequest = {
	jobs: string[];
};

export type UprnDownloadQueueStatus = {
	current: number;
	total: number;
};

export type UprnDownloadJobStatus = {
	type: string;
	fileSize: number;
	message: string;
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
	baseUrl: string;
	chatRoute: string;
	chatStreamRoute: string;
};

export type AiUprnChatbotRequest = {
	query: string;
};

export type AiUprnChatbotResponse = {
	response: string;
};
