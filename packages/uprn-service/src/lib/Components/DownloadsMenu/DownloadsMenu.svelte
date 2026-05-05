<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	import { useUprnDownloadJobStatuses } from '$lib/Hooks/UseUprnDownloadJobStatuses.svelte';
	import { useUprnDownloadRequestJob } from '$lib/Hooks/UseUprnDownloadRequestJob.svelte';
	import type DownloadsStore from '$lib/Stores/DownloadsStore.svelte';
	import {
		DownloadStatus,
		JobRequestResponseType,
		JobStatusType,
		type DownloadEntry,
		type UprnDownloadGetJobStatusesRequest,
		type UprnDownloadGetJobStatusesResponse,
		type UprnDownloadJobRequest
	} from '$lib/Types/Uprn.types';

	import DownloadListItem from './DownloadListItem.svelte';
	import DownloadQueueInfo from './DownloadQueueInfo.svelte';
	import DownloadsMenuHeader from './DownloadsMenuHeader.svelte';
	import EmptyDownloadsState from './EmptyDownloadsState.svelte';
	import {
		getDisplayErrorMessage,
		getDownloadUrl,
		getFileNameFromResponse,
		type QueueItem
	} from './downloadMenuUtils';

	/**
	 * Props interface for the downloads menu component.
	 */
	type Props = {
		downloadsStore: DownloadsStore;
		requestJobUrl: string;
		jobStatusesUrl: string;
		downloadBaseUrl: string;
		onOpenInfoDialog: (download: DownloadEntry) => void;
	};

	const {
		downloadsStore,
		requestJobUrl,
		jobStatusesUrl,
		downloadBaseUrl,
		onOpenInfoDialog
	}: Props = $props();

	const jobStatusBurstInterval = 3000;
	const jobStatusBurstDuration = 20000;
	const jobStatusCheckInterval = 15000;

	/** Hook for submitting download job requests. */
	const requestJobHook = $derived.by(() => useUprnDownloadRequestJob(requestJobUrl));

	/** Hook for checking job statuses. */
	const jobStatusesHook = $derived.by(() => useUprnDownloadJobStatuses(jobStatusesUrl));

	/** The list of downloads from the store. */
	const downloads = $derived.by(() => downloadsStore.getDownloads());

	/** Map to track the position of each download in the queue. */
	const queuePositions = new SvelteMap<string, QueueItem>();
	const downloadsInProgress = new SvelteSet<string>();

	let statusCheckTimeout: ReturnType<typeof setTimeout> | undefined;
	let statusCheckBurstEndsAt = 0;

	onMount(() => {
		void submitRequests();
		scheduleNextStatusCheck(getNextStatusCheckDelay());

		return () => {
			if (statusCheckTimeout) {
				clearTimeout(statusCheckTimeout);
			}
		};
	});

	$effect(() => {
		if (downloads.length <= 0) {
			return;
		}

		void submitRequests();
	});

	function scheduleNextStatusCheck(delayMs: number): void {
		if (statusCheckTimeout) {
			clearTimeout(statusCheckTimeout);
		}

		statusCheckTimeout = setTimeout(async () => {
			await checkJobStatuses();
			scheduleNextStatusCheck(getNextStatusCheckDelay());
		}, delayMs);
	}

	function hasBurstEligibleDownloads(): boolean {
		return downloads.some(
			(download) =>
				download.status === DownloadStatus.Pending || download.status === DownloadStatus.Submitted
		);
	}

	function getNextStatusCheckDelay(now = Date.now()): number {
		if (now < statusCheckBurstEndsAt && hasBurstEligibleDownloads()) {
			return jobStatusBurstInterval;
		}

		statusCheckBurstEndsAt = 0;
		return jobStatusCheckInterval;
	}

	function startStatusCheckBurst(now = Date.now()): void {
		statusCheckBurstEndsAt = now + jobStatusBurstDuration;
		scheduleNextStatusCheck(jobStatusBurstInterval);
	}

	async function submitRequests(): Promise<void> {
		for (const download of downloads) {
			if (download.externalId || download.status !== DownloadStatus.Pending) {
				continue;
			}

			download.status = DownloadStatus.Submitted;
			downloadsStore.updateDownloadStatus(download);

			const request = createJobRequest(download);
			console.log('[downloads-menu] Submitting download request:', request);

			await requestJobHook.fetch(request);
			const response = requestJobHook.content;

			if (
				requestJobHook.error ||
				!response ||
				!response.guid ||
				response.type !== JobRequestResponseType.Success
			) {
				download.status = DownloadStatus.Failed;
				download.errorMessage =
					response?.message || !response
						? 'The server did not return a valid response.'
						: !response.guid
							? 'The server responded but returned an invalid GUID.'
							: 'The server responded but did not return a successful response.';
				console.error('[downloads-menu] Download request failed:', response);
				downloadsStore.updateDownloadStatus(download);
				continue;
			}

			download.externalId = response.guid;
			downloadsStore.updateDownloadStatus(download);
			startStatusCheckBurst();
		}
	}

	function createJobRequest(download: DownloadEntry): UprnDownloadJobRequest {
		return {
			exports: {
				areaSelectionLayer: {
					remoteId: download.areaSelection.layerId,
					areas: download.areaSelection.areaFieldInfos.map((area) => area.code)
				},
				dataSelectionLayers: download.dataSelections.map((selection) => {
					return {
						remoteId: selection.layerId,
						fields: selection.fields
					};
				})
			}
		};
	}

	async function checkJobStatuses(): Promise<void> {
		if (downloads.length <= 0) {
			return;
		}

		const downloadsToCheck = getDownloadsToCheck();
		const request: UprnDownloadGetJobStatusesRequest = {
			jobs: downloadsToCheck
		};

		if (request.jobs.length === 0) {
			removeInvalidDownloads(downloadsToCheck);
			return;
		}

		console.log('[downloads-menu] Checking job statuses for downloads:', request);
		await jobStatusesHook.fetch(request);
		const response = jobStatusesHook.content as UprnDownloadGetJobStatusesResponse | undefined;
		console.log('[downloads-menu] Received job statuses response:', response, queuePositions);

		if (!response || jobStatusesHook.error) {
			console.warn('[downloads-menu] Failed to get job statuses.', response);
			return;
		}

		for (const job of response.jobs) {
			const matched = downloads.filter((download) => download.externalId === job.guid);
			if (!matched || matched.length === 0) {
				console.warn('[downloads-menu] Received job status for unknown download:', job.guid);
				continue;
			}

			for (const download of matched) {
				applyJobStatus(download, job);
				downloadsStore.updateDownloadStatus(download);
			}
		}
	}

	function getDownloadsToCheck(): string[] {
		return [
			...new Set(
				downloads
					.filter(
						(download) =>
							download.externalId &&
							download.status !== DownloadStatus.Completed &&
							download.status !== DownloadStatus.Failed
					)
					.map((download) => download.externalId!)
			)
		];
	}

	function removeInvalidDownloads(downloadsToCheck: string[]): void {
		if (downloadsToCheck.length <= 0) {
			return;
		}

		console.warn(
			'[downloads-menu] No jobs to check statuses for. However, there were downloads to check:',
			downloadsToCheck,
			'\nThis may indicate an issue with the download tracking logic or the indexDB was updated.',
			'\n Removing invalid downloads...'
		);

		for (const externalId of downloadsToCheck) {
			const localId = downloads.find((download) => download.externalId === externalId)?.localId;
			if (!localId) {
				continue;
			}

			downloadsStore.removeDownload(localId);
		}
	}

	function applyJobStatus(
		download: DownloadEntry,
		job: UprnDownloadGetJobStatusesResponse['jobs'][number]
	): void {
		switch (job.status.type) {
			case JobStatusType.Submitted:
				download.status = DownloadStatus.Submitted;
				download.errorMessage = undefined;
				download.fileSize = undefined;
				queuePositions.delete(job.guid);
				break;
			case JobStatusType.Queued:
				download.status = DownloadStatus.Queued;
				download.errorMessage = undefined;
				download.fileSize = undefined;
				queuePositions.set(job.guid, {
					queueId: job.status.queueId,
					queuePosition: job.status.queuePosition
				});
				break;
			case JobStatusType.Processing:
				download.status = DownloadStatus.InProgress;
				download.errorMessage = undefined;
				download.fileSize = undefined;
				queuePositions.delete(job.guid);
				break;
			case JobStatusType.Completed:
				download.status = DownloadStatus.Completed;
				download.errorMessage = undefined;
				download.fileSize = job.status.fileSize;
				queuePositions.delete(job.guid);
				break;
			case JobStatusType.Error:
				download.status = DownloadStatus.Failed;
				download.errorMessage = getDisplayErrorMessage(
					job.status.message ?? 'An unknown error occurred.'
				);
				download.fileSize = undefined;
				queuePositions.delete(job.guid);
				break;
			default:
				console.warn('[downloads-menu] Unknown job status type:', job.status.type);
				break;
		}
	}

	/**
	 * Retries a failed download by resetting its status to Pending.
	 */
	function retryDownload(localId: string): void {
		const download = downloads.find((d) => d.localId === localId);
		if (download) {
			download.status = DownloadStatus.Pending;
			download.isDownloaded = false;
			download.externalId = undefined;
			download.errorMessage = undefined;
			download.fileSize = undefined;
			downloadsStore.updateDownloadStatus(download);
		}
	}

	function removeDownload(localId: string): void {
		downloadsStore.removeDownload(localId);
	}

	async function downloadFile(download: DownloadEntry): Promise<void> {
		if (!download.externalId || downloadsInProgress.has(download.localId)) {
			return;
		}

		downloadsInProgress.add(download.localId);

		try {
			const response = await fetch(getDownloadUrl(downloadBaseUrl, download.externalId));
			if (!response.ok) {
				throw new Error(`Download failed with status ${response.status}.`);
			}

			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = objectUrl;
			anchor.download = getFileNameFromResponse(response, download.externalId);
			anchor.rel = 'noopener';
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(objectUrl);

			download.isDownloaded = true;
			downloadsStore.updateDownloadStatus(download);
		} catch (error) {
			console.error('[downloads-menu] Failed to download file:', error);
		} finally {
			downloadsInProgress.delete(download.localId);
		}
	}
</script>

<section class="mb-6 last:mb-0">
	<DownloadsMenuHeader count={downloads.length} class="pb-1" />
	<DownloadQueueInfo class="mb-3" />

	{#if downloads.length > 0}
		<ul class="m-0 list-none p-0">
			{#each downloads as download (download.localId)}
				<li class="m-0">
					<DownloadListItem
						{download}
						queueItem={download.externalId ? queuePositions.get(download.externalId) : undefined}
						downloadUrl={download.externalId
							? getDownloadUrl(downloadBaseUrl, download.externalId)
							: undefined}
						isDownloading={downloadsInProgress.has(download.localId)}
						onOpenInfo={() => onOpenInfoDialog(download)}
						onDownload={() => downloadFile(download)}
						onRetry={() => retryDownload(download.localId)}
						onRemove={() => removeDownload(download.localId)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyDownloadsState />
	{/if}
</section>
