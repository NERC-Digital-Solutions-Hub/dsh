import { requestJson } from './_api-request';
import type { QueryRequest, QueryResponse } from '$lib/types/api.types';

type QueryFetchOptions = {
	append?: boolean;
};

/**
 * Hook used to query catalogue metadata. It manages loading and error state,
 * aborts superseded requests, and only commits the latest response.
 * @param url The URL to the metadata query endpoint.
 * @returns The loading, error, content states as well as fetch and reset methods.
 */
export function useQueryMetadata(url: string) {
	let content = $state<QueryResponse | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);
	let activeRequest = 0;
	let abortController: AbortController | null = null;

	function reset() {
		abortController?.abort();
		abortController = null;
		activeRequest += 1;
		content = null;
		error = null;
		isLoading = false;
	}

	async function fetchAsync(request: QueryRequest, options: QueryFetchOptions = {}) {
		abortController?.abort();

		const requestId = ++activeRequest;
		const controller = new AbortController();
		abortController = controller;
		isLoading = true;
		error = null;

		try {
			console.debug('Sending metadata query', { request, options });
			const response = await requestJson<QueryResponse>(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request),
				signal: controller.signal
			});

			if (requestId !== activeRequest) {
				console.debug('Received response for stale request, ignoring', {
					requestId,
					activeRequest
				});
				return;
			}

			console.debug('Received metadata response', response);
			content = options.append
				? {
						...response,
						payload: [...(content?.payload ?? []), ...(response.payload ?? [])]
					}
				: response;
		} catch (err) {
			if (controller.signal.aborted || requestId !== activeRequest) {
				return;
			}

			error = err;
			if (!options.append) {
				content = null;
			}
		} finally {
			if (requestId === activeRequest) {
				isLoading = false;
				abortController = null;
			}
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
		fetch: fetchAsync,
		reset
	};
}
