import type {
	UprnDownloadGetJobStatusesRequest,
	UprnDownloadGetJobStatusesResult
} from '$lib/Types/uprn';

/**
 * Hook used to fetch the status of one or more UPRN download jobs. It manages the loading state,
 * any errors that occur during the request, and the resolved job statuses response.
 * @param url The URL to the UPRN download job statuses endpoint.
 * @returns The loading, error, content states as well as a fetch method that accepts a job statuses request.
 */
export function useUprnDownloadJobStatuses(url: string) {
	let content = $state<UprnDownloadGetJobStatusesResult | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync(request: UprnDownloadGetJobStatusesRequest) {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				throw new Error(`Failed to get job statuses: ${response.statusText}`);
			}

			content = (await response.json()) as UprnDownloadGetJobStatusesResult;
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	return {
		get content() {
			return content;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		fetch: fetchAsync
	};
}
