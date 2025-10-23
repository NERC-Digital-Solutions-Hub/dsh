import type {
	UprnDownloadEndpoints,
	UprnDownloadGetJobStatusesRequest,
	UprnDownloadGetJobStatusesResult,
	UprnDownloadHealthResponse,
	UprnDownloadJobRequest,
	UprnDownloadJobRequestResponse,
	UrpnDownloadAreaSelectionLimitResponse
} from '$lib/types/uprn';

// TODO: Each endpoint needs to be moved into their own class so loading and error can be handled
// more gracefully and consistently across the app.

/**
 * Service for managing the uprn downloads.
 */
export class UprnDownloadService {
	#endpoints: UprnDownloadEndpoints;

	constructor(endpoints: UprnDownloadEndpoints) {
		if (!endpoints) {
			throw new Error('UprnDownloadService endpoints configuration is required');
		}

		if (
			!endpoints.baseUrl ||
			!endpoints.healthRoute ||
			!endpoints.requestJobRoute ||
			!endpoints.requestJobStatusesRoute ||
			!endpoints.getAreaSelectionLimitsRoute
		) {
			throw new Error('UprnDownloadService endpoints configuration is incomplete');
		}

		this.#endpoints = endpoints;
	}

	/**
	 * Check the health status of the UPRN download service.
	 * @returns true if the service is healthy, false otherwise
	 */
	public async getHealth(): Promise<boolean> {
		try {
			const url = `${this.#endpoints.baseUrl}${this.#endpoints.healthRoute}`;
			const response = await fetch(url);

			if (!response.ok) {
				return false;
			}

			const data: UprnDownloadHealthResponse = await response.json();
			return data.status === 'ok';
		} catch (error) {
			console.error('Health check failed:', error);
			return false;
		}
	}

	/**
	 * Request a new download job.
	 * @param request - The job request containing export configuration
	 * @returns The job request response with GUID, or undefined if the request failed
	 */
	public async requestJob(
		request: UprnDownloadJobRequest
	): Promise<UprnDownloadJobRequestResponse | undefined> {
		try {
			const url = `${this.#endpoints.baseUrl}${this.#endpoints.requestJobRoute}`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				console.error(
					'Failed to request job:',
					response.statusText,
					'request:',
					JSON.stringify(request)
				);
				return undefined;
			}

			const data: UprnDownloadJobRequestResponse = await response.json();
			return data;
		} catch (error) {
			console.error('Error requesting job:', error);
			return undefined;
		}
	}

	/**
	 * Get the status of one or more download jobs.
	 * @param request - The request containing job GUIDs to check
	 * @returns The job statuses response, or undefined if the request failed
	 */
	public async requestJobStatuses(
		request: UprnDownloadGetJobStatusesRequest
	): Promise<UprnDownloadGetJobStatusesResult | undefined> {
		try {
			const url = `${this.#endpoints.baseUrl}${this.#endpoints.requestJobStatusesRoute}`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				console.error('Failed to get job statuses:', response.statusText);
				return undefined;
			}

			const data: UprnDownloadGetJobStatusesResult = await response.json();
			return data;
		} catch (error) {
			console.error('Error getting job statuses:', error);
			return undefined;
		}
	}

	/**
	 * Get the selection area limits for different layers.
	 * @returns Array of area selection limits, or undefined if the request failed
	 */
	public async getSelectionAreaLimits(): Promise<
		UrpnDownloadAreaSelectionLimitResponse[] | undefined
	> {
		try {
			const url = `${this.#endpoints.baseUrl}${this.#endpoints.getAreaSelectionLimitsRoute}`;
			const response = await fetch(url);

			if (!response.ok) {
				console.error('Failed to get area selection limits:', response.statusText);
				return undefined;
			}

			const data: UrpnDownloadAreaSelectionLimitResponse[] = await response.json();
			return data;
		} catch (error) {
			console.error('Error getting selection area limits:', error);
			return undefined;
		}
	}
}
