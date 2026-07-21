<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import { UprnDownloadClient } from '$lib/services/uprn-download-client';
	import type DownloadsStore from '$lib/stores/downloads-store.svelte';
	import type { DownloadEntry, UprnDownloadEndpoints } from '$lib/types/download.types';

	import DownloadListItem from './download-list-item.svelte';
	import DownloadQueueInfo from './download-queue-info.svelte';
	import DownloadsMenuHeader from './downloads-menu-header.svelte';
	import { DownloadsController } from './downloads-controller.svelte';
	import EmptyDownloadsState from './empty-downloads-state.svelte';

	type Props = {
		downloadsStore: DownloadsStore;
		endpoints: UprnDownloadEndpoints;
		portalItemId: string;
		onOpenInfoDialog: (download: DownloadEntry) => void;
	};

	const { downloadsStore, endpoints, portalItemId, onOpenInfoDialog }: Props = $props();
	const client = untrack(() => new UprnDownloadClient(endpoints));
	const controller = untrack(() => new DownloadsController(downloadsStore, client, portalItemId));
	const downloads = $derived(controller.downloads);

	onMount(() => {
		controller.start();
		return () => controller.stop();
	});

	$effect(() => {
		if (downloads.length > 0) void controller.submitRequests();
	});
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
						queueItem={download.externalId
							? controller.queuePositions.get(download.externalId)
							: undefined}
						downloadUrl={download.externalId
							? client.getDownloadUrl(download.externalId)
							: undefined}
						isDownloading={controller.downloadsInProgress.has(download.localId)}
						onOpenInfo={() => onOpenInfoDialog(download)}
						onDownload={() => void controller.downloadFile(download)}
						onRetry={() => controller.retry(download.localId)}
						onRemove={() => controller.remove(download.localId)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyDownloadsState />
	{/if}
</section>
