<script lang="ts">
	import AreaSelectionHoverCard from '$lib/components/area-selection-hover-card/area-selection-hover-card.svelte';
	import AreaSelectionToast from '$lib/components/area-selection-toast/area-selection-toast.svelte';
	import DownloadInfoDialog from '$lib/components/downloads-menu/download-info-dialog.svelte';
	import IntroductionDialog from '$lib/components/introduction-dialog/introduction-dialog.svelte';
	import ItemInfoDialog from '$lib/components/item-info-dialog/item-info-dialog.svelte';
	import { Toaster } from '$lib/components/shadcn/sonner';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import type { INodeProvider } from '$lib/services/i-node-provider';
	import type { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
	import type { WebMapStore } from '$lib/stores/web-map-store.svelte';
	import type { DownloadEntry } from '$lib/types/download.types';

	type Props = {
		introductionOpen: boolean;
		introductionMarkdown: string | null;
		itemInfoOpen: boolean;
		itemInfoLayerId: string | null;
		downloadInfoOpen: boolean;
		activeDownload: DownloadEntry | null;
		webMapService: WebMapStore | null;
		nodeProvider: INodeProvider;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionInteractionStore: AreaSelectionInteractionStore | null;
	};

	let {
		introductionOpen = $bindable(),
		introductionMarkdown,
		itemInfoOpen = $bindable(),
		itemInfoLayerId = $bindable(),
		downloadInfoOpen = $bindable(),
		activeDownload,
		webMapService,
		nodeProvider,
		nodeConfigProvider,
		areaSelectionInteractionStore
	}: Props = $props();
</script>

<IntroductionDialog bind:isOpen={introductionOpen} content={introductionMarkdown} />
<Toaster visibleToasts={1} position="bottom-right" />

{#if webMapService?.isLoaded}
	<ItemInfoDialog
		bind:isOpen={itemInfoOpen}
		bind:activeLayerId={itemInfoLayerId}
		webmapService={webMapService}
		{nodeConfigProvider}
	/>
	<DownloadInfoDialog
		bind:isOpen={downloadInfoOpen}
		download={activeDownload}
		{nodeProvider}
		{nodeConfigProvider}
	/>
{/if}

{#if areaSelectionInteractionStore}
	<AreaSelectionHoverCard {areaSelectionInteractionStore} />
	<AreaSelectionToast {areaSelectionInteractionStore} />
{/if}
