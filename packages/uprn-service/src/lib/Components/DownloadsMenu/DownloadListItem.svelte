<script lang="ts">
	import SelectionEntryCard from '$lib/Components/SelectionEntryCard/SelectionEntryCard.svelte';
	import { DownloadStatus, type DownloadEntry } from '$lib/Types/Uprn.types';

	import DownloadActionGroup from './DownloadActionGroup.svelte';
	import DownloadErrorAlert from './DownloadErrorAlert.svelte';
	import DownloadStatusIndicator from './DownloadStatusIndicator.svelte';
	import QueueStatus from './QueueStatus.svelte';
	import { getDownloadTitle, showDownloadErrorMessage, type QueueItem } from './downloadMenuUtils';

	/**
	 * Renders one download entry card.
	 *
	 * The parent list owns item placement. This component owns the row's semantic
	 * controls, queue status, and optional error footer.
	 */
	type Props = {
		download: DownloadEntry;
		downloadUrl?: string;
		isDownloading: boolean;
		queueItem?: QueueItem;
		onDownload: () => void;
		onOpenInfo: () => void;
		onRemove: () => void;
		onRetry: () => void;
	};

	const {
		download,
		downloadUrl,
		isDownloading,
		queueItem,
		onDownload,
		onOpenInfo,
		onRemove,
		onRetry
	}: Props = $props();
</script>

<SelectionEntryCard
	title={getDownloadTitle(download)}
	hasFooter={showDownloadErrorMessage(download)}
>
	{#if download.externalId && download.status === DownloadStatus.Queued}
		{#if queueItem && queueItem.queuePosition}
			<QueueStatus queueId={queueItem.queueId} queuePosition={queueItem.queuePosition} />
		{/if}
	{/if}

	<DownloadStatusIndicator status={download.status} />
	<DownloadActionGroup
		{download}
		{downloadUrl}
		{isDownloading}
		{onDownload}
		{onOpenInfo}
		{onRemove}
		{onRetry}
	/>

	{#snippet footer()}
		{#if showDownloadErrorMessage(download)}
			<DownloadErrorAlert message={download.errorMessage ?? 'An unknown error occurred.'} />
		{/if}
	{/snippet}
</SelectionEntryCard>
