import type {
	UprnDownloadAreaSelectionLimitResponse,
	UprnDownloadEndpoints,
	UprnDownloadGetJobStatusesRequest,
	UprnDownloadGetJobStatusesResult,
	UprnDownloadJobRequest,
	UprnDownloadJobRequestResponse
} from '$lib/Types/Download.types';

export class UprnDownloadClient {
	constructor(
		private readonly endpoints: UprnDownloadEndpoints,
		private readonly fetchImpl: typeof fetch = fetch
	) {}

	public async isHealthy(): Promise<boolean> {
		const response = await this.fetchImpl(this.url(this.endpoints.healthRoute), {
			credentials: 'include'
		});
		if (!response.ok) return false;
		const body = (await response.json()) as { status?: unknown };
		return body.status === 'ok';
	}

	public async getAreaSelectionLimits(
		portalItemId: string,
		layerIds: string[]
	): Promise<UprnDownloadAreaSelectionLimitResponse> {
		return this.postJson<UprnDownloadAreaSelectionLimitResponse>(
			this.endpoints.getAreaSelectionLimitsRoute,
			{ portalItemId, layers: layerIds }
		);
	}

	public async requestJob(
		request: UprnDownloadJobRequest
	): Promise<UprnDownloadJobRequestResponse> {
		const response = await this.fetchImpl(this.url(this.endpoints.requestJobRoute), {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(request)
		});
		const rawBody = await response.text();
		const parsedBody = parseJson(rawBody) as UprnDownloadJobRequestResponse | undefined;

		if (!response.ok) {
			throw new UprnDownloadClientError(
				rawBody || response.statusText || `Job request failed (${response.status})`,
				parsedBody
			);
		}
		if (!parsedBody) {
			throw new UprnDownloadClientError('The server did not return a valid JSON response.');
		}
		return parsedBody;
	}

	public async getJobStatuses(
		request: UprnDownloadGetJobStatusesRequest
	): Promise<UprnDownloadGetJobStatusesResult> {
		return this.postJson<UprnDownloadGetJobStatusesResult>(
			this.endpoints.requestJobStatusesRoute,
			request
		);
	}

	public async fetchDownload(externalId: string): Promise<Response> {
		const response = await this.fetchImpl(this.getDownloadUrl(externalId), {
			credentials: 'include'
		});
		if (!response.ok) {
			throw new Error(`Download failed with status ${response.status}.`);
		}
		return response;
	}

	public getDownloadUrl(externalId: string): string {
		return `${this.url(this.endpoints.fetchDownloadRoute)}/${encodeURIComponent(externalId)}`;
	}

	private async postJson<T>(route: string, body: unknown): Promise<T> {
		const response = await this.fetchImpl(this.url(route), {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			throw new Error(response.statusText || `Request failed (${response.status})`);
		}
		return (await response.json()) as T;
	}

	private url(route: string): string {
		return `${this.endpoints.baseUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;
	}
}

export class UprnDownloadClientError extends Error {
	constructor(
		message: string,
		public readonly response?: UprnDownloadJobRequestResponse
	) {
		super(message);
		this.name = 'UprnDownloadClientError';
	}
}

function parseJson(value: string): unknown {
	if (!value) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}
