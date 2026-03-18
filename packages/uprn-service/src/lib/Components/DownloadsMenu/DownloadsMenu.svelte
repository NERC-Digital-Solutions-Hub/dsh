<script lang="ts">
	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import HourglassIcon from '$lib/Components/Icons/HourglassIcon.svelte';
	import SelectionEntryCard from '$lib/Components/SelectionEntryCard/SelectionEntryCard.svelte';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import { Spinner } from '$lib/Components/shadcn/spinner/index.js';
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
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import Download from '@lucide/svelte/icons/download';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import RetryIcon from '@lucide/svelte/icons/rotate-ccw';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { onMount } from 'svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import * as Alert from '$lib/Components/shadcn/alert/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import QueueStatus from '$lib/Components/DownloadsMenu/QueueStatus.svelte';
	import { AlertCircleIcon, DownloadIcon } from '@lucide/svelte';

	type QueueItem = {
		queueId: number;
		queuePosition: number;
	};

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

	/** Hook for submitting download job requests. */
	const requestJobHook = $derived.by(() => useUprnDownloadRequestJob(requestJobUrl));

	/** Hook for checking job statuses. */
	const jobStatusesHook = $derived.by(() => useUprnDownloadJobStatuses(jobStatusesUrl));

	/** The list of downloads from the store. */
	const downloads = $derived.by(() => downloadsStore.getDownloads());

	/** Map to track the position of each download in the queue. */
	const queuePositions: Map<string, QueueItem> = $state(new SvelteMap());

	/**
	 * Status configuration for downloads, mapping status to colors, text, and icons.
	 */
	const statusConfig = {
		completed: { color: '#059669', text: 'Completed', icon: CheckCircleIcon, iconSize: 14 },
		'in-progress': { color: '#2563eb', text: 'In Progress', icon: LoaderIcon, iconSize: 14 },
		failed: { color: '#dc2626', text: 'Failed', icon: XCircleIcon, iconSize: 14 },
		pending: { color: '#6b7280', text: 'Pending', icon: HourglassIcon, iconSize: 22 },
		queued: { color: '#6b7280', text: 'Queued', icon: HourglassIcon, iconSize: 22 },
		submitted: { color: '#6b7280', text: 'Submitted', icon: HourglassIcon, iconSize: 22 }
	} satisfies Record<
		string,
		{
			color: string;
			text: string;
			icon: any;
			iconSize?: number;
		}
	>;

	const jobStatusImmediateCheckInterval = 10000; // 10 seconds
	const jobStatusCheckInterval = 30000; // 30 seconds
	let statusCheckTimeout: ReturnType<typeof setTimeout> | undefined;

	function getStatusCfg(status: string) {
		return statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
	}

	onMount(() => {
		submitRequests();
		scheduleNextStatusCheck(jobStatusCheckInterval);

		return () => {
			if (statusCheckTimeout) {
				clearTimeout(statusCheckTimeout);
			}
		};
	});

	function scheduleNextStatusCheck(delayMs: number) {
		if (statusCheckTimeout) {
			clearTimeout(statusCheckTimeout);
		}

		statusCheckTimeout = setTimeout(async () => {
			await checkJobStatuses();
			// After any one-off immediate check, return to the normal polling cadence.
			scheduleNextStatusCheck(jobStatusCheckInterval);
		}, delayMs);
	}

	$effect(() => {
		if (!downloads) {
			return;
		}

		// if downloads has changed, then submit a request to the uprn download service.
		if (downloads.length <= 0) {
			return;
		}

		submitRequests();
	});

	async function submitRequests() {
		let submittedAnyRequest = false;

		for (const download of downloads) {
			if (download.externalId || download.status !== DownloadStatus.Pending) {
				continue;
			}

			submittedAnyRequest = true;
			download.status = DownloadStatus.Submitted;
			downloadsStore.updateDownloadStatus(download);

			const request: UprnDownloadJobRequest = {
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
		}

		if (submittedAnyRequest) {
			// Speed up only the next status check after submitting new jobs.
			scheduleNextStatusCheck(jobStatusImmediateCheckInterval);
		}
	}

	async function checkJobStatuses() {
		if (downloads.length <= 0) {
			return;
		}

		const downloadsToCheck: string[] = downloads
			.filter(
				(download) =>
					download.externalId &&
					download.status !== DownloadStatus.Completed &&
					download.status !== DownloadStatus.Failed
			)
			.map((download) => download.externalId!);

		const request: UprnDownloadGetJobStatusesRequest = {
			jobs: downloadsToCheck
		};

		// console.log(
		// 	'[downloads-menu] Checking job statuses with request:',
		// 	request,
		// 	'downloads:',
		// 	downloads
		// );
		if (request.jobs.length === 0) {
			if (downloadsToCheck.length > 0) {
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
			return;
		}

		console.log('[downloads-menu] Checking job statuses for downloads:', request);
		await jobStatusesHook.fetch(request);
		const response = jobStatusesHook.content as UprnDownloadGetJobStatusesResponse | undefined;
		console.warn('[downloads-menu] Received job statuses response:', response, queuePositions);

		if (!response || jobStatusesHook.error) {
			console.error('[downloads-menu] Failed to get job statuses.', response);
			return;
		}

		for (const job of response.jobs) {
			const matched = downloads.filter((download) => download.externalId === job.guid);
			if (!matched || matched.length === 0) {
				console.warn('[downloads-menu] Received job status for unknown download:', job.guid);
				continue;
			}

			for (const download of matched) {
				switch (job.status.type) {
					case JobStatusType.Submitted:
						download.status = DownloadStatus.Submitted;
						download.errorMessage = undefined; // Clear any previous error message
						download.fileSize = undefined;
						queuePositions.delete(job.guid);
						break; // still pending
					case JobStatusType.Queued:
						download.status = DownloadStatus.Queued;
						download.errorMessage = undefined; // Clear any previous error message
						download.fileSize = undefined; // Clear any previous file size
						queuePositions.set(job.guid, {
							queueId: job.status.queueId,
							queuePosition: job.status.queuePosition
						});
						break; // still pending
					case JobStatusType.Processing:
						download.status = DownloadStatus.InProgress;
						download.errorMessage = undefined; // Clear any previous error message
						download.fileSize = undefined;
						queuePositions.delete(job.guid);
						break;
					case JobStatusType.Completed:
						download.status = DownloadStatus.Completed;
						download.errorMessage = undefined; // Clear any previous error message
						download.fileSize = job.status.fileSize;
						queuePositions.delete(job.guid);
						break;
					case JobStatusType.Error:
						download.status = DownloadStatus.Failed;
						download.errorMessage =
							job.status.message || 'An unknown error occurred during processing on the server.';
						download.fileSize = undefined;
						queuePositions.delete(job.guid);
						break;
					default:
						console.warn('[downloads-menu] Unknown job status type:', job.status.type);
						break;
				}

				downloadsStore.updateDownloadStatus(download);
			}
		}
	}

	/**
	 * Determines whether to show the error message for a download based on its status and the presence
	 * of an error message.
	 * @param download - The download entry to check.
	 * @return True if the error message should be shown, false otherwise.
	 */
	function showErrorMessage(download: DownloadEntry): boolean {
		return download.status === DownloadStatus.Failed && !!download.errorMessage;
	}

	/**
	 * Retries a failed download by resetting its status to Pending.
	 * @param localId - The local ID of the download to retry.
	 */
	function retryDownload(localId: string) {
		const download = downloads.find((d) => d.localId === localId);
		if (download) {
			download.status = DownloadStatus.Pending;
			download.externalId = undefined; // Clear external ID to force new submission
			download.errorMessage = undefined; // Clear error message
			download.fileSize = undefined; // Clear file size
			downloadsStore.updateDownloadStatus(download);
		}
	}

	/**
	 * Removes a download from the queue by its local ID.
	 * @param localId - The local ID of the download to remove.
	 */
	function removeDownload(localId: string) {
		downloadsStore.removeDownload(localId);
	}

	function getDownloadUrl(externalId: string): string {
		const base = downloadBaseUrl.replace(/\/+$/, '');
		return `${base}/${encodeURIComponent(externalId)}`;
	}
</script>

<div class="section">
	<div class="section-header">
		<div class="section-title ml-1">
			<DownloadIcon size={16} class="text-gray-500" />
			<h4>Downloads</h4>
		</div>
		{#if downloads.length > 0}
			<p class="count mr-0.5">{downloads.length} download(s)</p>
		{/if}
	</div>
	{#if downloads.length > 0}
		<ul class="selected-list">
			{#each downloads as download}
				<li class="download-item">
					<SelectionEntryCard
						title={download.externalId
							? download.externalId
							: download.status !== DownloadStatus.Failed
								? 'Pending...'
								: 'Failed to process export'}
						hasFooter={showErrorMessage(download)}
					>
						{#if download.externalId && download.status === DownloadStatus.Queued}
							{@const queueItem: QueueItem | undefined = queuePositions.get(download.externalId!)}
							{#if queueItem}
								<QueueStatus queueId={queueItem.queueId} queuePosition={queueItem.queuePosition} />
							{/if}
						{/if}
						<!-- <HourglassIcon color="#6b7280" /> -->
						{@const cfg = getStatusCfg(download.status)}
						<span class="inline-flex">
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="download-status-btn"
											style="color: {cfg.color}"
											disabled
										>
											{@const StatusIcon = cfg.icon}
											<StatusIcon
												size={cfg.iconSize ?? 14}
												color={cfg.color}
												class={download.status === 'in-progress' ? 'spinning' : ''}
											/>
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>{cfg.text}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</span>
						<Tooltip.Provider disableHoverableContent>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="sm"
										class="download-info-btn"
										onclick={() => onOpenInfoDialog(download)}
										aria-label="View download details"
									>
										<InfoIcon size={14} />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Details</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						{#if download.externalId}
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<CopyToClipboardButton
											value={getDownloadUrl(download.externalId!)}
											class="download-clipboard-btn"
											successMessage="URL copied to clipboard"
											errorMessage="Failed to copy URL to clipboard"
											title=""
											iconSize={14}
										/>
									</Tooltip.Trigger>
									<Tooltip.Content>Copy download URL</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						{#if download.externalId && download.status === 'completed'}
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="download-action-btn"
											onclick={() => window.open(getDownloadUrl(download.externalId!), '_blank')}
											aria-label="Open download"
										>
											<Download />
										</Button>
									</Tooltip.Trigger>
									{@const fileSizeBytes = download.fileSize ?? 0}
									{@const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2)}
									{@const downloadTooltip =
										fileSizeBytes > 0 ? `Download (${fileSizeMB} MB)` : 'Download'}
									<Tooltip.Content>{downloadTooltip}</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						{#if download.status === 'failed'}
							<Tooltip.Provider disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="download-retry-btn"
											onclick={() => retryDownload(download.localId)}
											aria-label="Retry download"
										>
											<RetryIcon size={14} />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>Retry</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						<Tooltip.Provider disableHoverableContent>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="sm"
										class="download-remove-btn"
										onclick={() => removeDownload(download.localId)}
										aria-label="Remove from queue"
									>
										×
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Remove</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						{#snippet footer()}
							{#if showErrorMessage(download)}
								{@const errorMessage = download.errorMessage ?? 'An unknown error occurred.'}
								<Alert.Root variant="destructive" class="download-error-alert">
									<AlertCircleIcon />
									<Alert.Description title={errorMessage}
										>{errorMessage.length > 60
											? `${errorMessage.slice(0, 60)}..`
											: errorMessage}</Alert.Description
									>
								</Alert.Root>
							{/if}
						{/snippet}
					</SelectionEntryCard>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="no-selection">No downloads in queue</p>
	{/if}
</div>

<style>
	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selected-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.download-item {
		margin: 0;
	}

	:global(.download-error-alert) {
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
	}

	:global(.download-status-btn .spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.download-action-btn),
	:global(.download-clipboard-btn),
	:global(.download-status-btn),
	:global(.download-info-btn),
	:global(.download-retry-btn),
	:global(.download-remove-btn) {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.download-status-btn) {
		cursor: default;
		opacity: 1;
	}

	:global(.download-status-btn:disabled) {
		opacity: 1;
		pointer-events: none;
	}

	:global(.download-action-btn:hover) {
		color: #059669;
	}

	:global(.download-info-btn:hover) {
		color: #2563eb;
	}

	:global(.download-clipboard-btn:hover) {
		color: #2563eb;
	}

	:global(.download-clipboard-btn:has(svg)) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.download-retry-btn:hover) {
		color: #2563eb;
	}

	:global(.download-remove-btn:hover) {
		color: #ef4444;
	}

	.count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.no-selection {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}
</style>
