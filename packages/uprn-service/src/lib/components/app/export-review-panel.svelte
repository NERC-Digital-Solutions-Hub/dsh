<script lang="ts">
	import ExportMenu from '$lib/components/export-menu/export-menu.svelte';
	import { ScrollArea } from '$lib/components/shadcn/scroll-area';
	import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
	import type { INodeProvider } from '$lib/services/i-node-provider';
	import type { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
	import type { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import type { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';

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
