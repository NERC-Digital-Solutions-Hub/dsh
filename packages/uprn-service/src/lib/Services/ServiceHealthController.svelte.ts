/** Stateful, abortable health check owned by the composition root that creates it. */
export class ServiceHealthController {
	public isAccessible = $state<boolean | null>(null);
	public error = $state<unknown>(null);
	public isLoading = $state(false);

	private readonly url: string;
	private readonly credentials?: RequestCredentials;
	private abortController: AbortController | null = null;

	constructor(url: string, credentials?: RequestCredentials) {
		this.url = url;
		this.credentials = credentials;
	}

	public async fetch(): Promise<void> {
		this.abortController?.abort();
		const abortController = new AbortController();
		this.abortController = abortController;
		this.isLoading = true;
		this.error = null;
		try {
			const response = await fetch(this.url, {
				credentials: this.credentials,
				signal: abortController.signal
			});
			if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`);
			const data = (await response.json()) as { status?: unknown };
			this.isAccessible = data.status === 'ok';
		} catch (error) {
			if (abortController.signal.aborted) return;
			this.error = error;
			this.isAccessible = false;
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
