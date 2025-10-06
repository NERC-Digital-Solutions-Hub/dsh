<script lang="ts">
	import UprnMapView from '$lib/components/common/uprn-map-view/uprn-map-view.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ArcgisTreeView from '$lib/components/common/data-selection-tree-view/tree-view.svelte';
	import ArcgisSoleSelectionTreeView from '$lib/components/common/area-selection-tree-view/tree-view.svelte';
	import SelectedAreasMenu from '$lib/components/common/area-selection-menu/area-selection-menu.svelte';
	import UprnTabBar from '$lib/components/common/uprn-tab-bar/uprn-tab-bar.svelte';
	import UprnTabBarContent from '$lib/components/common/uprn-tab-bar/uprn-tab-bar-content.svelte';
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
	import Button from '$lib/components/ui/button/button.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/field-selection-menu/field-selection-menu.svelte';
	import DownloadsMenu from '$lib/components/common/downloads-menu/downloads-menu.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { dataSelectionStore } from '$lib/stores/data-selection-store.svelte';

	const webMapStore = new WebMapStore();
	const fieldFilterMenuStore = new FieldFilterMenuStore();
	let treeviewSelectionAreasConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let treeviewDataConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let interactableLayers: string[] = $state([]);
	let fieldsToHide: Set<string> = $state(new Set());
	let currentTab = $state('define-areas');

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();

		treeviewSelectionAreasConfig = appConfig.treeviewSelectionAreasConfig;
		treeviewDataConfig = appConfig.treeviewDataConfig || null;
		fieldsToHide = new Set(appConfig.fieldsToHide || []);
		interactableLayers = appConfig.selectionLayersNameFields?.map((layer) => layer.layerName) || [];
		areaSelectionStore.setNameFields(appConfig.selectionLayersNameFields as LayerNameField[]);

		console.log('Selection Layers:', $state.snapshot(treeviewSelectionAreasConfig));

		await webMapStore.initializeAsync({
			portalUrl: appConfig.portalUrl,
			itemId: appConfig.portalItemId || '',
			proxy: appConfig.proxy
		});

		console.log('WebMap loaded');
	});

	function onTabValueChange(value: string) {
		currentTab = value;
	}

	function switchToDownloadsTab() {
		currentTab = 'downloads';
	}
</script>

<Toaster />
<AreaSelectionHoverCard />
<FieldSelectionMenu {fieldFilterMenuStore} {fieldsToHide} />

{#snippet panelContent()}
	<div class="flex w-120 min-w-0 flex-col gap-6">
		<UprnTabBar value={currentTab} onValueChange={onTabValueChange}>
			<UprnTabBarContent value="define-areas">
				<ArcgisSoleSelectionTreeView
					webMap={webMapStore.data}
					treeviewConfig={treeviewSelectionAreasConfig}
				/>
			</UprnTabBarContent>
			<UprnTabBarContent value="select-data">
				<ArcgisTreeView
					webMap={webMapStore.data}
					treeviewConfig={treeviewDataConfig}
					{fieldFilterMenuStore}
				/>
			</UprnTabBarContent>
			<UprnTabBarContent value="export">
				{#snippet footer()}
					<ExportMenuFooter onExportSuccess={switchToDownloadsTab} />
				{/snippet}
				<ExportMenu {webMapStore} {fieldFilterMenuStore} />
			</UprnTabBarContent>
			<UprnTabBarContent value="downloads">
				<DownloadsMenu />
			</UprnTabBarContent>
		</UprnTabBar>
	</div>
{/snippet}

<SelectedAreasMenu />

<div class="map-section">
	<UprnMapView
		webMap={webMapStore.data}
		{interactableLayers}
		panelPosition="top-left"
		menuPosition="top-right"
		panel={panelContent}
	/>
	<!-- {#if webMapStore.data}{:else if webMapStore.loading}
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
	{/if} -->
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
