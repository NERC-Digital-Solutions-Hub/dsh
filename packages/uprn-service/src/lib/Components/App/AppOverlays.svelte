<script lang="ts">
	import AreaSelectionHoverCard from '$lib/Components/AreaSelectionHoverCard/AreaSelectionHoverCard.svelte';
	import AreaSelectionToast from '$lib/Components/AreaSelectionToast/AreaSelectionToast.svelte';
	import DownloadInfoDialog from '$lib/Components/DownloadsMenu/DownloadInfoDialog.svelte';
	import IntroductionDialog from '$lib/Components/IntroductionDialog/IntroductionDialog.svelte';
	import ItemInfoDialog from '$lib/Components/ItemInfoDialog/ItemInfoDialog.svelte';
	import { Toaster } from '$lib/Components/shadcn/sonner';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeProvider } from '$lib/Services/INodeProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import type { WebMapStore } from '$lib/Stores/WebMapStore.svelte';
	import type { DownloadEntry } from '$lib/Types/Download.types';

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
