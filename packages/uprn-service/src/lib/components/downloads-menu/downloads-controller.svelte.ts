import { UprnDownloadClient, UprnDownloadClientError } from '$lib/services/uprn-download-client';
import type DownloadsStore from '$lib/stores/downloads-store.svelte';
import {
	DownloadStatus,
	JobRequestResponseType,
	JobStatusType,
	type DownloadEntry,
	type UprnDownloadGetJobStatusesResponse,
	type UprnDownloadJobRequest
} from '$lib/types/download.types';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { getDisplayErrorMessage, getFileNameFromResponse } from './download-menu-utils';

export type QueueItem = { queueId: number; queuePosition: number };

type PollingOptions = {
	burstIntervalMs?: number;
	burstDurationMs?: number;
	intervalMs?: number;
};

export class DownloadsController {
	public readonly queuePositions = new SvelteMap<string, QueueItem>();
	public readonly downloadsInProgress = new SvelteSet<string>();

	private statusCheckTimeout: ReturnType<typeof setTimeout> | undefined;
	private statusCheckBurstEndsAt = 0;
	private submitting = false;
	private readonly burstIntervalMs: number;
	private readonly burstDurationMs: number;
	private readonly intervalMs: number;

	constructor(
		private readonly store: DownloadsStore,
		private readonly client: UprnDownloadClient,
		private readonly portalItemId: string,
		options: PollingOptions = {}
	) {
		this.burstIntervalMs = options.burstIntervalMs ?? 3000;
		this.burstDurationMs = options.burstDurationMs ?? 20000;
		this.intervalMs = options.intervalMs ?? 5000;
	}

	public get downloads(): DownloadEntry[] {
		return this.store.getDownloads();
	}

	public start(): void {
		void this.submitRequests();
		this.scheduleNextStatusCheck(this.getNextStatusCheckDelay());
	}

	public stop(): void {
		if (this.statusCheckTimeout) clearTimeout(this.statusCheckTimeout);
		this.statusCheckTimeout = undefined;
	}

	public async submitRequests(): Promise<void> {
		if (this.submitting) return;
		this.submitting = true;
		try {
			for (const download of this.downloads) {
				if (download.externalId || download.status !== DownloadStatus.Pending) continue;

				this.update(download, { status: DownloadStatus.Submitted, errorMessage: undefined });
				try {
					const response = await this.client.requestJob(this.createJobRequest(download));
					if (!response.guid || response.type !== JobRequestResponseType.Success) {
						this.update(download, {
							status: DownloadStatus.Failed,
							errorMessage: response.message ?? 'The server did not return a successful response.'
						});
						continue;
					}

					this.update(download, {
						externalId: response.guid,
						status: DownloadStatus.Submitted,
						errorMessage: undefined
					});
					this.startStatusCheckBurst();
				} catch (error) {
					this.update(download, {
						status: DownloadStatus.Failed,
						errorMessage:
							error instanceof UprnDownloadClientError
								? (error.response?.message ?? error.message)
								: error instanceof Error
									? error.message
									: 'The download request failed.'
					});
				}
			}
		} finally {
			this.submitting = false;
		}
	}

	public async checkJobStatuses(): Promise<void> {
		const jobs = [
			...new SvelteSet(
				this.downloads.flatMap((download) => {
					if (
						!download.externalId ||
						download.status === DownloadStatus.Completed ||
						download.status === DownloadStatus.Failed
					)
						return [];
					return [download.externalId];
				})
			)
		];
		if (jobs.length === 0) return;

		const response = await this.client.getJobStatuses({ jobs });
		if (!('jobs' in response)) return;

		for (const job of response.jobs) {
			for (const download of this.downloads.filter((item) => item.externalId === job.guid)) {
				this.applyJobStatus(download, job);
			}
		}
	}

	public retry(localId: string): void {
		const download = this.downloads.find((item) => item.localId === localId);
		if (!download) return;
		this.update(download, {
			status: DownloadStatus.Pending,
			isDownloaded: false,
			externalId: undefined,
			errorMessage: undefined,
			fileSize: undefined
		});
		void this.submitRequests();
	}

	public remove(localId: string): void {
		this.store.removeDownload(localId);
	}

	public async downloadFile(download: DownloadEntry): Promise<void> {
		if (!download.externalId || this.downloadsInProgress.has(download.localId)) return;
		this.downloadsInProgress.add(download.localId);
		try {
			const response = await this.client.fetchDownload(download.externalId);
			const objectUrl = URL.createObjectURL(await response.blob());
			const anchor = document.createElement('a');
			anchor.href = objectUrl;
			anchor.download = getFileNameFromResponse(response, download.externalId);
			anchor.rel = 'noopener';
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(objectUrl);
			this.update(download, { isDownloaded: true });
		} finally {
			this.downloadsInProgress.delete(download.localId);
		}
	}

	private createJobRequest(download: DownloadEntry): UprnDownloadJobRequest {
		return {
			portalItemId: this.portalItemId,
			area: {
				id: download.areaSelection.layerId,
				selections: download.areaSelection.areaFieldInfos.map((area) => area.code)
			},
			data: download.dataSelections.map((selection) => ({
				id: selection.layerId,
				fields: selection.fields
			}))
		};
	}

	private applyJobStatus(
		download: DownloadEntry,
		job: UprnDownloadGetJobStatusesResponse['jobs'][number]
	): void {
		switch (job.status.type) {
			case JobStatusType.Submitted:
				this.queuePositions.delete(job.guid);
				this.update(download, { status: DownloadStatus.Submitted, errorMessage: undefined });
				break;
			case JobStatusType.Queued:
				this.queuePositions.set(job.guid, {
					queueId: job.status.queueId,
					queuePosition: job.status.queuePosition
				});
				this.update(download, { status: DownloadStatus.Queued, errorMessage: undefined });
				break;
			case JobStatusType.Processing:
				this.queuePositions.delete(job.guid);
				this.update(download, { status: DownloadStatus.InProgress, errorMessage: undefined });
				break;
			case JobStatusType.Completed:
				this.queuePositions.delete(job.guid);
				this.update(download, {
					status: DownloadStatus.Completed,
					errorMessage: undefined,
					fileSize: job.status.fileSize
				});
				break;
			case JobStatusType.Error:
				this.queuePositions.delete(job.guid);
				this.update(download, {
					status: DownloadStatus.Failed,
					errorMessage: getDisplayErrorMessage(job.status.message ?? 'An unknown error occurred.'),
					fileSize: undefined
				});
				break;
		}
	}

	private update(download: DownloadEntry, patch: Partial<DownloadEntry>): void {
		this.store.updateDownloadStatus({ ...download, ...patch });
	}

	private scheduleNextStatusCheck(delayMs: number): void {
		if (this.statusCheckTimeout) clearTimeout(this.statusCheckTimeout);
		this.statusCheckTimeout = setTimeout(async () => {
			try {
				await this.checkJobStatuses();
			} finally {
				this.scheduleNextStatusCheck(this.getNextStatusCheckDelay());
			}
		}, delayMs);
	}

	private getNextStatusCheckDelay(now = Date.now()): number {
		const burstEligible = this.downloads.some(
			(download) =>
				download.status === DownloadStatus.Pending || download.status === DownloadStatus.Submitted
		);
		if (now < this.statusCheckBurstEndsAt && burstEligible) return this.burstIntervalMs;
		this.statusCheckBurstEndsAt = 0;
		return this.intervalMs;
	}

	private startStatusCheckBurst(now = Date.now()): void {
		this.statusCheckBurstEndsAt = now + this.burstDurationMs;
		this.scheduleNextStatusCheck(this.burstIntervalMs);
	}
}
