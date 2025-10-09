<script lang="ts">
	import UprnMapView from '$lib/components/common/services/uprn/uprn-map-view/uprn-map-view.svelte';
	import AreaSelectionTreeview from '$lib/components/common/services/uprn/tree-view/area-selection/tree-view.svelte';
	import SelectedAreasMenu from '$lib/components/common/services/uprn/area-selection-menu/area-selection-menu.svelte';
	import UprnTabBar from '$lib/components/common/services/uprn/uprn-tab-bar/uprn-tab-bar.svelte';
	import UprnTabBarContent from '$lib/components/common/services/uprn/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import type { TreeviewConfig } from '$lib/utils/treeview-config.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';
	import { areaSelectionStore, type LayerNameField } from '$lib/stores/area-selection-store.svelte';
	import ExportMenu from '$lib/components/common/services/uprn/export-menu/export-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/services/uprn/export-menu/export-menu-footer.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/services/uprn/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/services/uprn/field-selection-menu/field-selection-menu.svelte';
	import DownloadsMenu from '$lib/components/common/services/uprn/downloads-menu/downloads-menu.svelte';
	import DataSelectionTreeview from '$lib/components/common/services/uprn/tree-view/data-selection/tree-view.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/treeview-store.svelte';

	const webMapStore = new WebMapStore();
	const fieldFilterMenuStore = new FieldFilterMenuStore();
	let treeviewSelectionAreasConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let treeviewDataConfig: TreeviewConfig | null = $state<TreeviewConfig | null>(null);
	let interactableLayers: string[] = $state([]);
	let fieldsToHide: Set<string> = $state(new Set());
	let currentTab = $state('define-areas');
	let dataSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state<
		TreeviewConfigStore | undefined
	>();
	let areaSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state<
		TreeviewConfigStore | undefined
	>();
	const areaSelectionTreeviewStore: TreeviewStore = $state(new TreeviewStore());

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();

		treeviewSelectionAreasConfig = appConfig.treeviewSelectionAreasConfig;
		treeviewDataConfig = appConfig.treeviewDataConfig || null;
		fieldsToHide = new Set(appConfig.fieldsToHide || []);
		interactableLayers = appConfig.selectionLayersNameFields?.map((layer) => layer.layerName) || [];
		areaSelectionStore.setNameFields(appConfig.selectionLayersNameFields as LayerNameField[]);
		dataSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.dataSelectionTreeviewConfig as TreeviewConfig
		);

		areaSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.areaSelectionTreeviewConfig as TreeviewConfig
		);

		console.log('[page] Selection Layers:', $state.snapshot(treeviewSelectionAreasConfig));

		await webMapStore.initializeAsync({
			portalUrl: appConfig.portalUrl,
			itemId: appConfig.portalItemId || '',
			proxy: appConfig.proxy
		});

		console.log('[page] WebMap loaded');
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
				<AreaSelectionTreeview
					webMap={webMapStore.data}
					treeviewStore={areaSelectionTreeviewStore}
					treeviewConfigStore={areaSelectionTreeviewConfig!}
				/>
			</UprnTabBarContent>
			<UprnTabBarContent value="select-data">
				<DataSelectionTreeview
					webMap={webMapStore.data}
					treeviewConfigStore={dataSelectionTreeviewConfig!}
					{fieldFilterMenuStore}
				/>
			</UprnTabBarContent>
			<UprnTabBarContent value="export">
				{#snippet footer()}
					<ExportMenuFooter onExportSuccess={switchToDownloadsTab} />
				{/snippet}
				<ExportMenu {webMapStore} {areaSelectionTreeviewStore} {fieldFilterMenuStore} />
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
		{areaSelectionTreeviewStore}
		panelPosition="top-left"
		menuPosition="top-right"
		panel={panelContent}
	/>
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
