<script lang="ts">
	import UprnMapView from '$lib/components/common/services/uprn/uprn-map-view/uprn-map-view.svelte';
	import AreaSelectionTreeview from '$lib/components/common/services/uprn/tree-view/area-selection/tree-view.svelte';
	import AreaSelectionToast from '$lib/components/common/services/uprn/area-selection-toast/area-selection-toast.svelte';
	import UprnTabBar from '$lib/components/common/services/uprn/uprn-tab-bar/uprn-tab-bar.svelte';
	import UprnTabBarContent from '$lib/components/common/services/uprn/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import { getAppConfigAsync } from '$lib/utils/app-config-provider.js';
	import type { TreeviewConfig } from '$lib/types/treeview.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/services/uprn/web-map-store.svelte';
	import { areaSelectionStore } from '$lib/stores/services/uprn/area-selection-store.svelte';
	import ExportMenu from '$lib/components/common/services/uprn/export-menu/export-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/services/uprn/export-menu/export-menu-footer.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/services/uprn/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/services/uprn/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/services/uprn/field-selection-menu/field-selection-menu.svelte';
	import DownloadsMenu from '$lib/components/common/services/uprn/downloads-menu/downloads-menu.svelte';
	import DataSelectionTreeview from '$lib/components/common/services/uprn/tree-view/data-selection/tree-view.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TreeviewConfigStore } from '$lib/stores/services/uprn/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn/treeview-store.svelte';
	import TabBarTriggers from './tabBarTriggers.json';
	import type { AppConfig } from '$lib/types/config';

	const webMapStore: WebMapStore = $state(new WebMapStore());
	const fieldFilterMenuStore: FieldFilterMenuStore = $state(new FieldFilterMenuStore());
	const areaSelectionTreeviewStore: TreeviewStore = $state(new TreeviewStore());

	let currentTab = $state('define-areas');
	let fieldsToHide: Set<string> = $state(new Set());
	let dataSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let areaSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();

		fieldsToHide = new Set(appConfig.serviceUprnConfig.fieldsToHide || []);
		areaSelectionStore.setNameFields(appConfig.serviceUprnConfig.selectionLayersNameFields || []);
		dataSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprnConfig.dataSelectionTreeviewConfig as TreeviewConfig
		);

		areaSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprnConfig.areaSelectionTreeviewConfig as TreeviewConfig
		);

		await webMapStore.initializeAsync({
			portalUrl: appConfig.serviceUprnConfig.portalUrl,
			itemId: appConfig.serviceUprnConfig.portalItemId || '',
			proxy: appConfig.serviceUprnConfig.proxy
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
<AreaSelectionToast />

{#snippet panelContent()}
	<div class="flex w-120 min-w-0 flex-col gap-6">
		<UprnTabBar value={currentTab} triggers={TabBarTriggers} onValueChange={onTabValueChange}>
			<UprnTabBarContent value="define-areas">
				{#if webMapStore.isLoaded}
					<AreaSelectionTreeview
						webMap={webMapStore.data}
						treeviewStore={areaSelectionTreeviewStore}
						treeviewConfigStore={areaSelectionTreeviewConfig!}
					/>
				{/if}
			</UprnTabBarContent>
			<UprnTabBarContent value="select-data">
				{#if webMapStore.isLoaded}
					<DataSelectionTreeview
						webMap={webMapStore.data}
						treeviewConfigStore={dataSelectionTreeviewConfig!}
						{fieldFilterMenuStore}
					/>
				{/if}
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
