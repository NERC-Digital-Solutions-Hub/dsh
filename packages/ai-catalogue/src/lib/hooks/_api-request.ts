import type { ValidationProblemDetails } from '$lib/types/api.types';

export interface ApiRequestError extends Error {
	status: number;
	statusText: string;
	bodyText: string;
	validationProblem?: ValidationProblemDetails;
}

interface ParsedApiResponse<T> {
	data?: T;
	bodyText: string;
	contentType: string;
}

function tryParseJson<T>(bodyText: string, contentType: string): T | undefined {
	if (!bodyText || !contentType.toLowerCase().includes('json')) {
		return undefined;
	}

	try {
		return JSON.parse(bodyText) as T;
	} catch {
		return undefined;
	}
}

async function parseApiResponse<T>(response: Response): Promise<ParsedApiResponse<T>> {
	const contentType = response.headers.get('content-type') ?? '';
	const bodyText = await response.text();

	return {
		data: tryParseJson<T>(bodyText, contentType),
		bodyText,
		contentType
	};
}

export async function requestJson<TResponse>(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<TResponse> {
	const headers = new Headers(init?.headers);
	headers.set('Accept', 'application/json');

	const response = await fetch(input, {
		credentials: 'include',
		...init,
		headers,
	});

	const parsedResponse = await parseApiResponse<TResponse>(response);

	if (!response.ok) {
		const error = new Error(
			parsedResponse.bodyText || response.statusText || `Request failed (${response.status})`
		) as ApiRequestError;

		error.name = 'ApiRequestError';
		error.status = response.status;
		error.statusText = response.statusText;
		error.bodyText = parsedResponse.bodyText;
		error.validationProblem = tryParseJson<ValidationProblemDetails>(
			parsedResponse.bodyText,
			parsedResponse.contentType
		);

		throw error;
	}

	if (parsedResponse.data === undefined) {
		throw new Error('Expected a JSON response body but none was returned.');
	}

	return parsedResponse.data;
}
