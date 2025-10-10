<script lang="ts">
	import UprnMapView from '$lib/components/common/services/uprn2/uprn-map-view/uprn-map-view.svelte';
	import AreaSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/area-selection/tree-view.svelte';
	import AreaSelectionToast from '$lib/components/common/services/uprn2/area-selection-toast/area-selection-toast.svelte';
	import UprnTabBar from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar.svelte';
	import UprnTabBarContent from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import type { TreeviewConfig } from '$lib/utils/treeview-config.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';
	import { areaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import ExportMenu from '$lib/components/common/services/uprn2/export-menu/export-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/services/uprn2/export-menu/export-menu-footer.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/services/uprn2/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/services/uprn2/field-selection-menu/field-selection-menu.svelte';
	import DownloadsMenu from '$lib/components/common/services/uprn2/downloads-menu/downloads-menu.svelte';
	import DataSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/data-selection/tree-view.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/treeview-store2.svelte';
	import TabBarTriggers from './tabBarTriggers.json';
	import Sidebar from '$lib/components/common/sidebar/sidebar.svelte';

	const webMapStore: WebMapStore = $state(new WebMapStore());
	const fieldFilterMenuStore: FieldFilterMenuStore = $state(new FieldFilterMenuStore());
	const areaSelectionTreeviewStore: TreeviewStore = $state(new TreeviewStore());

	let currentTab = $state('define-areas');
	let fieldsToHide: Set<string> = $state(new Set());
	let dataSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let areaSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let sidebarOpen = $state(true);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();

		fieldsToHide = new Set(appConfig.fieldsToHide || []);
		areaSelectionStore.setNameFields(appConfig.selectionLayersNameFields || []);
		dataSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.dataSelectionTreeviewConfig as TreeviewConfig
		);

		areaSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.areaSelectionTreeviewConfig as TreeviewConfig
		);

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
<AreaSelectionToast />

<div class="layout-container">
	<Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar}>
		<UprnTabBar value={currentTab} triggers={TabBarTriggers} onValueChange={onTabValueChange}>
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
					{fieldsToHide}
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
	</Sidebar>

	<div class="map-section">
		<UprnMapView
			webMap={webMapStore.data}
			{areaSelectionTreeviewStore}
			panelPosition="top-left"
			menuPosition="top-right"
		/>
	</div>
</div>

<style>
	.layout-container {
		display: flex;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	.map-section {
		flex: 1 1 auto;
		min-height: 0;
		min-width: 0;
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
