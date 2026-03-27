import { requestJson } from './_api-request';
import type { GetArchetypesResponse } from '$lib/types/api.types';

/**
 * Hook used to fetch catalogue archetypes. It manages loading and error state,
 * aborts superseded requests, and only commits the latest response.
 * @param url The URL to the archetypes endpoint.
 * @returns The loading, error, content states as well as fetch and reset methods.
 */
export function useFetchArchetypes(url: string) {
	let content = $state<GetArchetypesResponse | null>(null);
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

	async function fetchAsync() {
		abortController?.abort();

		const requestId = ++activeRequest;
		const controller = new AbortController();
		abortController = controller;
		isLoading = true;
		error = null;

		try {
			const response = await requestJson<GetArchetypesResponse>(url, {
				method: 'GET',
				signal: controller.signal
			});

			if (requestId !== activeRequest) {
				return;
			}

			content = response;
		} catch (err) {
			if (controller.signal.aborted || requestId !== activeRequest) {
				return;
			}

			error = err;
			content = null;
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
