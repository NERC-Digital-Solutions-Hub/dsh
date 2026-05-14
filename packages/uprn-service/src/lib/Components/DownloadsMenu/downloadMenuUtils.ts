import { DownloadStatus, type DownloadEntry } from '$lib/Types/Uprn.types';

export type QueueItem = {
	queueId: number;
	queuePosition: number;
};

const MAX_ERROR_MESSAGE_LENGTH = 240;

/**
 * Returns the card title for a download entry without exposing layout concerns.
 */
export function getDownloadTitle(download: DownloadEntry): string {
	if (download.externalId) {
		return download.externalId;
	}

	return download.status !== DownloadStatus.Failed ? 'Pending...' : 'Failed to process export';
}

/**
 * Determines whether a download row should show its error footer.
 */
export function showDownloadErrorMessage(download: DownloadEntry): boolean {
	return download.status === DownloadStatus.Failed && !!download.errorMessage;
}

/**
 * Keeps long API error text readable inside a compact download row.
 */
export function truncateDownloadErrorMessage(errorMessage: string): string {
	return errorMessage.length > MAX_ERROR_MESSAGE_LENGTH
		? `${errorMessage.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...`
		: errorMessage;
}

/**
 * Returns a user-friendly error message based on a service error string.
 */
export function getDisplayErrorMessage(errorMessage: string): string {
	const lowerMessage = errorMessage.toLowerCase();
	if (
		lowerMessage.includes('timedout') ||
		lowerMessage.includes('timeout') ||
		lowerMessage.includes('timed out') ||
		lowerMessage.includes('time out')
	) {
		return "Error: Download timed out. This is a beta limitation for large downloads but we're working on improving this in the future.";
	}

	if (lowerMessage.includes('outofmemoryexception')) {
		return 'Error: Out of memory. This is a beta limitation for large downloads or when the service is under heavy load. Please try again.';
	}

	return errorMessage;
}

/**
 * Builds a stable download URL from the configured base URL and external job ID.
 */
export function getDownloadUrl(downloadBaseUrl: string, externalId: string): string {
	const base = downloadBaseUrl.replace(/\/+$/, '');
	return `${base}/${encodeURIComponent(externalId)}`;
}

/**
 * Extracts a browser download filename from a service response.
 */
export function getFileNameFromResponse(response: Response, externalId: string): string {
	const contentDisposition = response.headers.get('content-disposition');
	if (contentDisposition) {
		const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
		if (utf8Match?.[1]) {
			return decodeURIComponent(utf8Match[1]);
		}

		const filenameMatch = contentDisposition.match(/filename\s*=\s*"?(?<name>[^";]+)"?/i);
		if (filenameMatch?.groups?.name) {
			return filenameMatch.groups.name;
		}
	}

	return `uprn-download-${externalId}.zip`;
}

/**
 * Returns the tooltip text for the row download button.
 */
export function getDownloadTooltip(download: DownloadEntry, isDownloading: boolean): string {
	if (isDownloading) {
		return 'Downloading...';
	}

	const fileSizeBytes = download.fileSize ?? 0;
	if (fileSizeBytes > 0) {
		const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
		return download.isDownloaded
			? `Download again (${fileSizeMB} MB)`
			: `Download (${fileSizeMB} MB)`;
	}

	return download.isDownloaded ? 'Download again' : 'Download';
}
