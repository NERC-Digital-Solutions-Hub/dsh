<script lang="ts">
	import DownloadsMenu from '$lib/components/downloads-menu/downloads-menu.svelte';
	import Spinner from '$lib/components/shadcn/spinner/spinner.svelte';
	import type { ServiceHealthController } from '$lib/services/service-health-controller.svelte';
	import type DownloadsStore from '$lib/stores/downloads-store.svelte';
	import type { DownloadEntry, UprnDownloadEndpoints } from '$lib/types/download.types';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		health: ServiceHealthController | null;
		portalItemId: string | null;
		endpoints?: UprnDownloadEndpoints;
		downloadsStore: DownloadsStore;
		onOpenInfoDialog: (download: DownloadEntry) => void;
	};

	const {
		class: className,
		health,
		portalItemId,
		endpoints,
		downloadsStore,
		onOpenInfoDialog
	}: Props = $props();
</script>

<div class={cn('min-h-0', className)}>
	{#if !health || health.isLoading}
		<div class="flex h-full w-full items-center justify-center">
			<Spinner class="size-10" />
		</div>
	{:else if !health.isAccessible || health.error}
		<p class="p-4 text-center text-sm text-muted-foreground">Download service is not available.</p>
	{:else if !portalItemId}
		<p class="p-4 text-center text-sm text-destructive">
			Download configuration requires a portal-item map source.
		</p>
	{:else if endpoints}
		<DownloadsMenu {downloadsStore} {endpoints} {portalItemId} {onOpenInfoDialog} />
	{/if}
</div>
