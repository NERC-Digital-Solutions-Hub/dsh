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
		type UprnDownloadGetJobStatusesRequest,
		type UprnDownloadGetJobStatusesResponse,
		type UprnDownloadJobRequest
	} from '$lib/Types/Uprn.types';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import Download from '@lucide/svelte/icons/download';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import RetryIcon from '@lucide/svelte/icons/rotate-ccw';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { onMount } from 'svelte';

	/**
	 * Props interface for the downloads menu component.
	 */
	type Props = {
		downloadsStore: DownloadsStore;
		requestJobUrl: string;
		jobStatusesUrl: string;
		downloadBaseUrl: string;
	};

	const { downloadsStore, requestJobUrl, jobStatusesUrl, downloadBaseUrl }: Props = $props();

	/** Hook for submitting download job requests. */
	const requestJobHook = $derived.by(() => useUprnDownloadRequestJob(requestJobUrl));

	/** Hook for checking job statuses. */
	const jobStatusesHook = $derived.by(() => useUprnDownloadJobStatuses(jobStatusesUrl));

	const downloads = $derived.by(() => downloadsStore.getDownloads());

	/**
	 * Status configuration for downloads, mapping status to colors, text, and icons.
	 */
	const statusConfig = {
		completed: { color: '#059669', text: 'Completed', icon: CheckCircleIcon, iconSize: 14 },
		'in-progress': { color: '#2563eb', text: 'In Progress', icon: LoaderIcon, iconSize: 14 },
		failed: { color: '#dc2626', text: 'Failed', icon: XCircleIcon, iconSize: 14 },
		pending: { color: '#6b7280', text: 'Pending', icon: Spinner, iconSize: 14 },
		queued: { color: '#6b7280', text: 'Queued', icon: HourglassIcon, iconSize: 22 },
		submitted: { color: '#6b7280', text: 'Submitted', icon: Spinner, iconSize: 14 }
	} satisfies Record<
		string,
		{
			color: string;
			text: string;
			icon: any;
			iconSize?: number;
		}
	>;

	function getStatusCfg(status: string) {
		return statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
	}

	onMount(() => {
		submitRequests();

		const interval = setInterval(() => {
			checkJobStatuses();
		}, 30000); // Check every 30 seconds

		return () => {
			clearInterval(interval);
		};
	});

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
		for (const download of downloads) {
			if (download.externalId || download.status !== DownloadStatus.Pending) {
				continue;
			}

			download.status = DownloadStatus.InProgress;
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

		console.log(
			'[downloads-menu] Checking job statuses with request:',
			request,
			'downloads:',
			downloads
		);
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
						break; // still pending
					case JobStatusType.Queued:
						download.status = DownloadStatus.Queued;
						download.errorMessage = undefined; // Clear any previous error message
						break; // still pending
					case JobStatusType.Processing:
						download.status = DownloadStatus.InProgress;
						download.errorMessage = undefined; // Clear any previous error message
						break;
					case JobStatusType.Completed:
						download.status = DownloadStatus.Completed;
						download.errorMessage = undefined; // Clear any previous error message
						break;
					case JobStatusType.Error:
						download.status = DownloadStatus.Failed;
						download.errorMessage =
							job.status.message || 'An unknown error occurred during processing on the server.';
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
	 * Retries a failed download by resetting its status to Pending.
	 * @param localId - The local ID of the download to retry.
	 */
	function retryDownload(localId: string) {
		const download = downloads.find((d) => d.localId === localId);
		if (download) {
			download.status = DownloadStatus.Pending;
			download.externalId = undefined; // Clear external ID to force new submission
			download.errorMessage = undefined; // Clear error message
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

	/**
	 * Gets the color associated with a download status.
	 * @param status - The download status.
	 * @returns The color string.
	 */
	function getStatusColor(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.color ?? statusConfig.pending.color;
	}

	/**
	 * Gets the display text for a download status.
	 * @param status - The download status.
	 * @returns The status text.
	 */
	function getStatusText(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.text ?? statusConfig.pending.text;
	}

	/**
	 * Gets the icon component for a download status.
	 * @param status - The download status.
	 * @returns The icon component.
	 */
	function getStatusIcon(status: string) {
		return statusConfig[status as keyof typeof statusConfig]?.icon ?? statusConfig.pending.icon;
	}

	function getDownloadUrl(externalId: string): string {
		const base = downloadBaseUrl.replace(/\/+$/, '');
		return `${base}/${encodeURIComponent(externalId)}`;
	}
</script>

<div class="section">
	<h4>Download Queue</h4>
	{#if downloads.length > 0}
		<ul class="selected-list">
			{#each downloads as download}
				<SelectionEntryCard
					title={download.externalId
						? download.externalId
						: download.status !== DownloadStatus.Failed
							? 'Pending...'
							: 'Failed to process export'}
				>
					{#if download.status === DownloadStatus.Failed && download.errorMessage}
						<span class="text-sm text-red-600 italic ml-2" title={download.errorMessage}>
							{download.errorMessage.length > 30
								? `${download.errorMessage.slice(0, 30)}...`
								: download.errorMessage}
						</span>
					{/if}
					<!-- <HourglassIcon color="#6b7280" /> -->
					{@const cfg = getStatusCfg(download.status)}
					<span title={cfg.text} class="inline-flex">
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
					</span>
					{#if download.externalId}
						<CopyToClipboardButton
							value={getDownloadUrl(download.externalId!)}
							class="download-clipboard-btn"
							title="Copy URL to clipboard"
							successMessage="URL copied to clipboard"
							errorMessage="Failed to copy URL to clipboard"
							iconSize={14}
						/>
					{/if}
					{#if download.externalId && download.status === 'completed'}
						<Button
							variant="ghost"
							size="sm"
							class="download-action-btn"
							onclick={() => window.open(getDownloadUrl(download.externalId!), '_blank')}
							title="Open download"
						>
							<Download />
						</Button>
					{/if}
					{#if download.status === 'failed'}
						<Button
							variant="ghost"
							size="sm"
							class="download-retry-btn"
							onclick={() => retryDownload(download.localId)}
							title="Retry download"
						>
							<RetryIcon size={14} />
						</Button>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="download-remove-btn"
						onclick={() => removeDownload(download.localId)}
						title="Remove from queue"
					>
						×
					</Button>
				</SelectionEntryCard>
			{/each}
		</ul>
		<p class="count">{downloads.length} download(s) in queue</p>
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

	h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	.selected-list {
		list-style: none;
		padding: 0;
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
		margin: 0;
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
