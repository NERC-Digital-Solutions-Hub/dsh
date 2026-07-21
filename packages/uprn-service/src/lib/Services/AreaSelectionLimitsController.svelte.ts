import type { UprnDownloadAreaSelectionLimitResponse } from '$lib/Types/Download.types';

/** Loads configured export limits and aborts stale requests when configuration changes. */
export class AreaSelectionLimitsController {
	public content = $state<UprnDownloadAreaSelectionLimitResponse | null>(null);
	public error = $state<unknown>(null);
	public isLoading = $state(false);

	private readonly url: string;
	private readonly portalItemId: string;
	private readonly layerIds: string[];
	private abortController: AbortController | null = null;

	constructor(url: string, portalItemId: string, layerIds: string[]) {
		this.url = url;
		this.portalItemId = portalItemId;
		this.layerIds = layerIds;
	}

	public async fetch(): Promise<void> {
		this.abortController?.abort();
		const abortController = new AbortController();
		this.abortController = abortController;
		this.isLoading = true;
		this.error = null;
		try {
			const response = await fetch(this.url, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ portalItemId: this.portalItemId, layers: this.layerIds }),
				signal: abortController.signal
			});
			if (!response.ok) {
				throw new Error(`Failed to get selection area limits: ${response.statusText}`);
			}
			this.content = (await response.json()) as UprnDownloadAreaSelectionLimitResponse;
		} catch (error) {
			if (!abortController.signal.aborted) this.error = error;
		} finally {
			if (this.abortController === abortController) this.isLoading = false;
		}
	}

	public destroy(): void {
		this.abortController?.abort();
		this.abortController = null;
		this.isLoading = false;
	}
}
