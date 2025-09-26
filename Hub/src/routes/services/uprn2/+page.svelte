<script lang="ts">
	import UprnMapView from '$lib/components/common/uprn-map-view/uprn-map-view.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import ArcgisTreeView from '$lib/components/common/data-selection-tree-view/tree-view.svelte';
	import ArcgisSoleSelectionTreeView from '$lib/components/common/area-selection-tree-view/tree-view.svelte';
	import SelectedAreasMenu from '$lib/components/common/area-selection-menu/area-selection-menu.svelte';
	import UprnTabBar from '$lib/components/common/uprn-tab-bar.svelte';
	import {
		getAppConfigAsync,
		type AppConfig,
		type TreeviewConfig
	} from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';
	import { areaSelectionStore, type LayerNameField } from '$lib/stores/area-selection-store.svelte';
	import ExportMenu from '$lib/components/common/export-menu/export-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/export-menu/export-menu-footer.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/field-selection-menu/field-selection-menu.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { dataSelectionStore } from '$lib/stores/data-selection-store.svelte';

	const webMapStore = new WebMapStore();
	const fieldFilterMenuStore = new FieldFilterMenuStore();
	let treeviewSelectionAreasConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let treeviewDataConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let interactableLayers: string[] = $state([]);
	let fieldsToHide: Set<string> = $state(new Set());

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();
		const portalUrl = appConfig.portalUrl;
		const portalId = appConfig.portalItemId;
		const proxy = appConfig.proxy;
		treeviewSelectionAreasConfig = appConfig.treeviewSelectionAreasConfig;
		treeviewDataConfig = appConfig.treeviewDataConfig || null;
		interactableLayers = appConfig.selectionLayersNameFields?.map((layer) => layer.layerName) || [];
		areaSelectionStore.setNameFields(appConfig.selectionLayersNameFields as LayerNameField[]);
		fieldsToHide = new Set(appConfig.fieldsToHide || []);

		console.log('Selection Layers:', $state.snapshot(treeviewSelectionAreasConfig));

		await webMapStore.initializeAsync({
			portalUrl: portalUrl,
			itemId: portalId || '',
			proxy: proxy
		});

		console.log('WebMap loaded');
	});
</script>

<Toaster />
<AreaSelectionHoverCard />
<FieldSelectionMenu {fieldFilterMenuStore} {fieldsToHide} />

{#snippet panelContent()}
	<div class="flex w-120 min-w-0 flex-col gap-6">
		<UprnTabBar value="define-areas">
			<Tabs.Content value="define-areas" class="w-full">
				<Card.Root class="w-full overflow-hidden">
					<Card.Content class="card-content overflow-hidden p-0">
						<ScrollArea class="h-[300px] w-full">
							<div class="min-w-0 space-y-2 overflow-hidden p-4">
								<ArcgisSoleSelectionTreeView
									webMap={webMapStore.data}
									treeviewConfig={treeviewSelectionAreasConfig}
								/>
							</div>
						</ScrollArea>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="select-data" class="w-full">
				<Card.Root class="w-full overflow-hidden">
					<Card.Content class="card-content overflow-hidden p-0">
						<ScrollArea class="h-[300px] w-full">
							<div class="min-w-0 space-y-2 overflow-hidden p-4">
								<ArcgisTreeView
									webMap={webMapStore.data}
									treeviewConfig={treeviewDataConfig}
									{fieldFilterMenuStore}
								/>
							</div>
						</ScrollArea>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="export" class="w-full">
				<Card.Root class="w-full overflow-hidden">
					<Card.Content class="card-content overflow-hidden p-0">
						<ScrollArea class="h-[300px] w-full">
							<div class="min-w-0 space-y-2 overflow-hidden p-4">
								<ExportMenu {webMapStore} {fieldFilterMenuStore} />
							</div>
						</ScrollArea>
					</Card.Content>
					<CardFooter class="flex items-center justify-between">
						<ExportMenuFooter />
					</CardFooter>
				</Card.Root>
			</Tabs.Content>
		</UprnTabBar>
	</div>
{/snippet}

<SelectedAreasMenu />

<div class="map-section">
	{#if webMapStore.data}
		<UprnMapView
			webMap={webMapStore.data}
			{interactableLayers}
			panelPosition="top-left"
			menuPosition="top-right"
			panel={panelContent}
		/>
	{:else if webMapStore.loading}
		<div class="loading-container">
			<p>Loading map data...</p>
		</div>
	{:else if webMapStore.error}
		<div class="error-container">
			<p>Error loading map: {webMapStore.error}</p>
			<Button onclick={() => webMapStore.clearError()}>Retry</Button>
		</div>
	{:else}
		<div class="loading-container">
			<p>Initializing map...</p>
		</div>
	{/if}
</div>

<style>
	.map-section {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
	}

	.loading-container,
	.error-container {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 1rem;
	}

	.error-container {
		color: #dc2626; /* red-600 */
	}

	:global(.card-content) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
