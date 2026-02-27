import type { UprnDownloadJobRequest, UprnDownloadJobRequestResponse } from '$lib/Types/Uprn.types';

/**
 * Hook used to request a new UPRN download job. It manages the loading state,
 * any errors that occur during the request, and the resolved job request response containing the job GUID.
 * @param url The URL to the UPRN download request job endpoint.
 * @returns The loading, error, content states as well as a fetch method that accepts a job request.
 */
export function useUprnDownloadRequestJob(url: string) {
	let content = $state<UprnDownloadJobRequestResponse | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync(request: UprnDownloadJobRequest) {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(url, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(request)
			});

			const contentType = response.headers.get('content-type') ?? '';
			const rawBody = await response.text();

			const parsedBody =
				contentType.includes('application/json') && rawBody
					? (() => {
							try {
								return JSON.parse(rawBody);
							} catch {
								return undefined;
							}
						})()
					: undefined;

			if (!response.ok) {
				content =
					parsedBody ??
					({
						type: 'error',
						guid: (parsedBody as Record<string, unknown>)?.guid ?? '',
						message: rawBody || response.statusText || `Request failed (${response.status})`
					} as UprnDownloadJobRequestResponse);

				throw new Error(
					rawBody || response.statusText || `Job request failed (${response.status})`
				);
			}

			content = parsedBody as UprnDownloadJobRequestResponse;
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
