<script lang="ts">
	import SvelteMapView from '$lib/components/common/map-view.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import ArcgisTreeView from '$lib/components/common/arcgis-tree-view/tree-view.svelte';
	import ArcgisSoleSelectionTreeView from '$lib/components/common/sole-selection-tree-view/tree-view.svelte';
	import {
		getAppConfigAsync,
		type AppConfig,
		type TreeviewConfig
	} from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';

	const webMapStore = new WebMapStore();
	let treeviewSelectionAreasConfig: TreeviewConfig[] | null = $state<TreeviewConfig[] | null>(null);
	let treeviewDataConfig: TreeviewConfig[] | null = $state<TreeviewConfig[] | null>(null);

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();
		const portalUrl = appConfig.portalUrl;
		const portalId = appConfig.portalItemId;
		const proxy = appConfig.proxy;
		treeviewSelectionAreasConfig = appConfig.treeviewSelectionAreasConfig;
		treeviewDataConfig = appConfig.treeviewDataConfig || null;

		console.log('Selection Layers:', $state.snapshot(treeviewSelectionAreasConfig));

		await webMapStore.initializeAsync({
			portalUrl: portalUrl,
			itemId: portalId || '',
			proxy: proxy
		});

		console.log('WebMap loaded', $state.snapshot(webMapStore.data));
	});
</script>

{#snippet panelContent()}
	<div class="flex w-120 min-w-0 flex-col gap-6">
		<Tabs.Root value="selection-areas" class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="selection-areas">Selection Areas</Tabs.Trigger>
				<Tabs.Trigger value="data">Layers</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="selection-areas" class="w-full">
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
			<Tabs.Content value="data" class="w-full">
				<Card.Root class="w-full overflow-hidden">
					<Card.Content class="card-content overflow-hidden p-0">
						<ScrollArea class="h-[300px] w-full">
							<div class="min-w-0 space-y-2 overflow-hidden p-4">
								<ArcgisTreeView webMap={webMapStore.data} treeviewConfig={treeviewDataConfig} />
							</div>
						</ScrollArea>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/snippet}

<div class="map-section">
	{#if webMapStore.data}
		<SvelteMapView
			webMap={webMapStore.data}
			panelPosition="top-left"
			menuPosition="top-right"
			panel={panelContent}
		/>
	{:else}
		<p>Loading map...</p>
	{/if}
</div>

<style>
	.map-section {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
	}

	:global(.card-content) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
