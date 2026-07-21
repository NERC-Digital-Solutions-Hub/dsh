<script lang="ts">
	import ExportMenu from '$lib/Components/ExportMenu/ExportMenu.svelte';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeProvider } from '$lib/Services/INodeProvider';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import type { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
	import type { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';

	type Props = {
		enabled: boolean;
		nodeProvider: INodeProvider;
		nodeConfigProvider: INodeConfigProvider;
		areaSelectionStore: AreaSelectionStore;
		areaSelectionInteractionStore: AreaSelectionInteractionStore | null;
		dataSelectionStore: DataSelectionStore;
		webMapLoaded: boolean;
	};

	const {
		enabled,
		nodeProvider,
		nodeConfigProvider,
		areaSelectionStore,
		areaSelectionInteractionStore,
		dataSelectionStore,
		webMapLoaded
	}: Props = $props();
</script>

<ScrollArea class="h-full w-full" type="always" scrollbarYClasses="z-50">
	{#if enabled && areaSelectionInteractionStore}
		<div class="min-w-0 px-3">
			<ExportMenu
				{nodeProvider}
				{nodeConfigProvider}
				{areaSelectionStore}
				{areaSelectionInteractionStore}
				{dataSelectionStore}
				{webMapLoaded}
			/>
		</div>
	{/if}
</ScrollArea>
