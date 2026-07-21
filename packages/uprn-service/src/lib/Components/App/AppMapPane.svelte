<script lang="ts">
	import Spinner from '$lib/Components/shadcn/spinner/spinner.svelte';
	import UprnMapView from '$lib/Components/UprnMapView/UprnMapView.svelte';
	import type { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import type { TabType } from '$lib/Types/App.types';
	import { cn } from '$lib/utils';
	import type { SvelteSet } from 'svelte/reactivity';

	type Props = {
		webMap: __esri.WebMap | null;
		mapView: __esri.MapView | null;
		areaSelectionInteractionStore: AreaSelectionInteractionStore | null;
		interactableLayers: SvelteSet<string>;
		currentTab: TabType;
		errorMessage: string | null;
		onClearSelections: () => void;
		onHideVisibleDataLayer: () => void;
		hasVisibleDataLayer: boolean;
		class?: string;
	};

	const {
		webMap,
		mapView,
		areaSelectionInteractionStore,
		interactableLayers,
		currentTab,
		errorMessage,
		onClearSelections,
		onHideVisibleDataLayer,
		hasVisibleDataLayer,
		class: className
	}: Props = $props();
</script>

<div class={cn('flex min-h-0 min-w-0 flex-1', className)}>
	{#if webMap && mapView && areaSelectionInteractionStore}
		<UprnMapView
			{webMap}
			{mapView}
			{areaSelectionInteractionStore}
			{interactableLayers}
			{currentTab}
			{onClearSelections}
			{onHideVisibleDataLayer}
			{hasVisibleDataLayer}
			class="h-full min-h-0 w-full flex-1"
		/>
	{:else if errorMessage}
		<div class="flex h-full w-full items-center justify-center p-6">
			<div class="max-w-md rounded-md border bg-background p-4 text-center shadow-sm">
				<p class="text-sm font-medium text-foreground">Map failed to load.</p>
				<p class="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
			</div>
		</div>
	{:else}
		<div class="flex h-full w-full items-center justify-center">
			<Spinner class="size-10" />
		</div>
	{/if}
</div>
