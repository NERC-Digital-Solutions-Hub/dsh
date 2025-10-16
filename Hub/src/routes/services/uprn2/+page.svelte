<script lang="ts">
	import UprnMapView from '$lib/components/common/services/uprn2/uprn-map-view/uprn-map-view.svelte';
	import AreaSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/area-selection/tree-view.svelte';
	import AreaSelectionToast from '$lib/components/common/services/uprn2/area-selection-toast/area-selection-toast.svelte';
	import UprnTabBar from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar.svelte';
	import UprnTabBarContent from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import { getAppConfigAsync } from '$lib/utils/app-config-provider.js';
	import type { TreeviewConfig } from '$lib/types/treeview.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/services/uprn2/web-map-store.svelte';
	import { areaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import ExportMenu from '$lib/components/common/services/uprn2/export-menu/export-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/services/uprn2/export-menu/export-menu-footer.svelte';
	import AreaSelectionHoverCard from '$lib/components/common/services/uprn2/area-selection-hover-card/area-selection-hover-card.svelte';
	import FieldFilterMenuStore from '$lib/stores/services/uprn2/field-filter-menu-store.svelte';
	import FieldSelectionMenu from '$lib/components/common/services/uprn2/field-selection-menu/field-selection-menu.svelte';
	import DownloadsMenu from '$lib/components/common/services/uprn2/downloads-menu/downloads-menu.svelte';
	import DataSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/data-selection/tree-view.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';
	import TabBarTriggers from './tabBarTriggers.json';
	import SidebarLayout from '$lib/components/common/sidebar/sidebar-layout.svelte';
	import Sidebar from '$lib/components/common/sidebar/sidebar.svelte';
	import { SidebarPosition } from '$lib/components/common/sidebar/sidebar-position';
	import type { AppConfig, SizeConfig } from '$lib/types/config';
	import { Bot } from 'lucide-svelte';
	import UprnChat from '$lib/components/common/services/uprn2/chat/chat.svelte';
	import { get } from 'svelte/store';

	const webMapStore: WebMapStore = $state(new WebMapStore());
	const fieldFilterMenuStore: FieldFilterMenuStore = $state(new FieldFilterMenuStore());
	const areaSelectionTreeviewStore: TreeviewStore = $state(new TreeviewStore());

	let currentTab = $state('define-areas');
	let dataSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let areaSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let mainSidebarOpen = $state(true);
	let mainSidebarPosition = $state<(typeof SidebarPosition)[keyof typeof SidebarPosition]>(
		SidebarPosition.LEFT
	);
	let chatSidebarOpen = $state(true);
	let chatSidebarPosition = $state<(typeof SidebarPosition)[keyof typeof SidebarPosition]>(
		SidebarPosition.BOTTOM
	);
	let mainSidebarSizes: SizeConfig[] = $state([]);
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);

	// Derive the original size (initial size) based on window width and breakpoints
	let mainSidebarOriginalSize = $derived.by(() =>
		getMatchingSize(mainSidebarSizes, (config) => config.originalSize)
	);

	// Derive the minimum size (for resizing)
	let mainSidebarMinSize = $derived.by(() =>
		getMatchingSize(mainSidebarSizes, (config) => config.minSize)
	);

	function getMatchingSize(sizes: SizeConfig[], expr: (config: SizeConfig) => string) {
		if (!sizes || sizes.length === 0) {
			return undefined;
		}

		const sortedSizes = [...sizes].sort((a, b) => b.breakpoint - a.breakpoint);
		const matchingSize = sortedSizes.find((config) => windowWidth >= config.breakpoint);
		return matchingSize ? expr(matchingSize) : '0';
	}

	function toggleMainSidebar() {
		mainSidebarOpen = !mainSidebarOpen;
	}

	function toggleChatSidebar() {
		chatSidebarOpen = !chatSidebarOpen;
	}

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();

		areaSelectionStore.setNameFields(appConfig.serviceUprn2Config.selectionLayersNameFields || []);
		mainSidebarSizes = appConfig.serviceUprn2Config.mainSidebarSizes || [];

		dataSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprn2Config.dataSelectionTreeviewConfig as TreeviewConfig
		);

		areaSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprn2Config.areaSelectionTreeviewConfig as TreeviewConfig
		);

		await webMapStore.initializeAsync({
			portalUrl: appConfig.serviceUprn2Config.portalUrl,
			itemId: appConfig.serviceUprn2Config.portalItemId || '',
			proxy: appConfig.serviceUprn2Config.proxy
		});

		console.log('[page] WebMap loaded');
	});

	// Set up window resize listener for reactive sidebar sizing
	onMount(() => {
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
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
<FieldSelectionMenu {fieldFilterMenuStore} />
<AreaSelectionToast />

<SidebarLayout
	isOpen={mainSidebarOpen}
	onToggle={toggleMainSidebar}
	position={mainSidebarPosition}
	originalSize={mainSidebarOriginalSize}
	minSize={mainSidebarMinSize}
>
	{#snippet sidebarContent()}
		<div class="relative flex h-full w-full min-w-0 overflow-visible">
			<div class="flex h-full w-full min-w-0 flex-col overflow-hidden">
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

			<Sidebar
				isOpen={chatSidebarOpen}
				onToggle={toggleChatSidebar}
				position={chatSidebarPosition}
				originalSize="300px"
				overlay
				openIcon={Bot}
			>
				{#snippet children()}
					<UprnChat />
				{/snippet}
			</Sidebar>
		</div>
	{/snippet}

	{#snippet mainContent()}
		<UprnMapView
			webMap={webMapStore.data}
			{areaSelectionTreeviewStore}
			panelPosition="top-left"
			menuPosition="top-right"
		/>
	{/snippet}
</SidebarLayout>

<style>
	:global(.card-content) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
