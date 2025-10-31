<script lang="ts">
	import AreaSelectionHoverCard from '$lib/components/common/services/uprn2/area-selection-hover-card/area-selection-hover-card.svelte';
	import AreaSelectionToast from '$lib/components/common/services/uprn2/area-selection-toast/area-selection-toast.svelte';
	import UprnChat from '$lib/components/common/services/uprn2/chat/chat.svelte';
	import DownloadsMenu from '$lib/components/common/services/uprn2/downloads-menu/downloads-menu.svelte';
	import ExportMenuFooter from '$lib/components/common/services/uprn2/export-menu/export-menu-footer.svelte';
	import ExportMenu from '$lib/components/common/services/uprn2/export-menu/export-menu.svelte';
	import FieldSelectionMenu from '$lib/components/common/services/uprn2/field-selection-menu/field-selection-menu.svelte';
	import AreaSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/area-selection/tree-view.svelte';
	import DataSelectionTreeview from '$lib/components/common/services/uprn2/tree-view/data-selection/tree-view.svelte';
	import UprnMapView from '$lib/components/common/services/uprn2/uprn-map-view/uprn-map-view.svelte';
	import UprnTabBarContent from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import UprnTabBar from '$lib/components/common/services/uprn2/uprn-tab-bar/uprn-tab-bar.svelte';
	import * as Sidebar from '$lib/components/common/sidebar/index.js';
	import * as SidebarLayout from '$lib/components/common/sidebar-layout/index.js';
	import { SidebarPosition } from '$lib/components/common/sidebar/sidebar-position.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import { areaSelectionStore } from '$lib/stores/services/uprn2/area-selection-store.svelte';
	import FieldFilterMenuStore from '$lib/stores/services/uprn2/field-filter-menu-store.svelte';
	import { TreeviewConfigStore } from '$lib/stores/services/uprn2/treeview-config-store';
	import { TreeviewStore } from '$lib/stores/services/uprn2/treeview-store.svelte';
	import { WebMapStore } from '$lib/stores/services/uprn2/web-map-store.svelte';
	import type { AppConfig, SizeConfig } from '$lib/types/config';
	import type { TreeviewConfig } from '$lib/types/treeview.js';
	import { getAppConfigAsync } from '$lib/utils/app-config-provider.js';
	import { Bot } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import TabBarTriggers from './tabBarTriggers.json';
	import ChatToggleBar from '$lib/components/common/services/uprn2/chat/chat-toggle-bar.svelte';
	import { mapInteractionStore } from '$lib/stores/services/uprn2/map-interaction-store.svelte';
	import { dataSelectionStore } from '$lib/stores/services/uprn2/data-selection-store.svelte';
	import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/types/uprn';
	import { UprnDownloadService } from '$lib/services/uprn-download-service';
	import { AiUprnChatbotService } from '$lib/services/ai-uprn-chatbot-service';
	import { clearDatabase } from '$lib/db';
	import { CustomRendererService } from '$lib/services/custom-renderer-service';

	const webMapStore: WebMapStore = $state(new WebMapStore());
	const fieldFilterMenuStore: FieldFilterMenuStore = $state(new FieldFilterMenuStore());
	const areaSelectionTreeviewStore: TreeviewStore = $state(new TreeviewStore());

	let currentTab: string = $state('define-areas');
	let dataSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let areaSelectionTreeviewConfig: TreeviewConfigStore | undefined = $state();
	let uprnDownloadService: UprnDownloadService | undefined = $state();
	let aiUprnChatbotService: AiUprnChatbotService | undefined = $state();
	let isUprnDownloadServiceAvailable: boolean = $state(false);
	let isAiUprnChatbotServiceAvailable: boolean = $state(false);
	let fieldsToHide: Set<string> = $state(new Set());

	// === Sidebar State ===
	let mainSidebarOpen = $state(true);
	let mainSidebarPosition = $state<Sidebar.PositionType>(SidebarPosition.LEFT);
	let chatSidebarOpen = $state(true);
	let chatSidebarPosition = $state<Sidebar.PositionType>(SidebarPosition.BOTTOM);
	let mainSidebarSizes: SizeConfig[] = $state([]);
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);

	// === Derived State for Responsive Sidebar Sizing ===

	/**
	 * Derives the original size (initial size) based on window width and breakpoints.
	 */
	let mainSidebarOriginalSize = $derived.by(() =>
		getMatchingSize(mainSidebarSizes, (config) => config.originalSize)
	);

	/**
	 * Derives the minimum size (for resizing) based on window width and breakpoints.
	 */
	let mainSidebarMinSize = $derived.by(() =>
		getMatchingSize(mainSidebarSizes, (config) => config.minSize)
	);

	/**
	 * Gets the matching size configuration based on window width breakpoints.
	 * @param sizes - Array of size configurations with breakpoints
	 * @param expr - Function to extract the desired size property from a config
	 * @returns The matching size string or '0' if no match found
	 */
	function getMatchingSize(sizes: SizeConfig[], expr: (config: SizeConfig) => string) {
		if (!sizes || sizes.length === 0) {
			return undefined;
		}

		const sortedSizes = [...sizes].sort((a, b) => b.breakpoint - a.breakpoint);
		const matchingSize = sortedSizes.find((config) => windowWidth >= config.breakpoint);
		return matchingSize ? expr(matchingSize) : '0';
	}

	/**
	 * Toggles the main sidebar open/closed state.
	 */
	function toggleMainSidebar() {
		mainSidebarOpen = !mainSidebarOpen;
	}

	/**
	 * Toggles the chat sidebar open/closed state.
	 */
	function toggleChatSidebar() {
		chatSidebarOpen = !chatSidebarOpen;
	}

	/**
	 * Handles tab value changes and updates the current tab state.
	 * @param value - The new tab value to switch to
	 */
	function onTabValueChange(value: string) {
		currentTab = value;
	}

	/**
	 * Switches to the downloads tab, typically called after a successful export.
	 */
	function switchToDownloadsTab() {
		currentTab = 'downloads';
	}

	/**
	 * Initializes the application by loading configuration and setting up stores.
	 */
	onMount(async () => {
		await clearDatabase(); // TODO: Remove this line after testing

		const customRendererService = new CustomRendererService();
		await customRendererService.init('/custom-renderers.sqlite');
		console.log('[uprn-2/page] CustomRendererService initialized');
		const customRenderer = await customRendererService.getCustomRenderer();
		console.log('[uprn-2/page] Retrieved custom renderer:', customRenderer);

		const appConfig: AppConfig = await getAppConfigAsync();

		areaSelectionStore.setFieldInfo(appConfig.serviceUprn2Config.selectionLayersNameFields || []);
		mainSidebarSizes = appConfig.serviceUprn2Config.mainSidebarSizes || [];

		dataSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprn2Config.dataSelectionTreeviewConfig as TreeviewConfig
		);

		areaSelectionTreeviewConfig = new TreeviewConfigStore(
			appConfig.serviceUprn2Config.areaSelectionTreeviewConfig as TreeviewConfig
		);

		const uprnDownloadServiceEndpoints: UprnDownloadEndpoints | undefined =
			appConfig.serviceUprn2Config.uprnDownloadServiceEndpoints;
		const aiUprnChatbotServiceEndpoints: AiUprnChatbotEndpoints | undefined =
			appConfig.serviceUprn2Config.aiUprnChatbotServiceEndpoints;
		uprnDownloadService = new UprnDownloadService(uprnDownloadServiceEndpoints);
		aiUprnChatbotService = new AiUprnChatbotService(aiUprnChatbotServiceEndpoints);

		isUprnDownloadServiceAvailable = await uprnDownloadService.getHealth();
		if (isUprnDownloadServiceAvailable)
			console.log('[uprn-2/page] UPRN Download Service is available');
		else console.warn('[uprn-2/page] UPRN Download Service is NOT available');

		isAiUprnChatbotServiceAvailable = await aiUprnChatbotService.getHealth();
		if (isAiUprnChatbotServiceAvailable)
			console.log('[uprn-2/page] AI UPRN Chatbot Service is available');
		else console.warn('[uprn-2/page] AI UPRN Chatbot Service is NOT available');

		fieldsToHide = new Set(
			appConfig.serviceUprn2Config.dataSelectionTreeviewConfig?.fieldsToHide || []
		);

		await webMapStore.initializeAsync({
			portalUrl: appConfig.serviceUprn2Config.portalUrl,
			itemId: appConfig.serviceUprn2Config.portalItemId || '',
			proxy: appConfig.serviceUprn2Config.proxy
		});

		console.log('[page] WebMap loaded');
	});

	/**
	 * Sets up window resize listener for reactive sidebar sizing.
	 */
	onMount(() => {
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		areaSelectionStore.cleanup();
		areaSelectionTreeviewStore.cleanup();
		dataSelectionStore.cleanup();
		mapInteractionStore.cleanup();
	});
</script>

<Toaster />
<AreaSelectionHoverCard />
<FieldSelectionMenu {fieldFilterMenuStore} />
<AreaSelectionToast />

<Sidebar.Root
	isOpen={mainSidebarOpen}
	onToggle={toggleMainSidebar}
	position={mainSidebarPosition}
	originalSize={mainSidebarOriginalSize}
	minSize={mainSidebarMinSize}
>
	{#snippet sidebarContent()}
		<div class="relative flex h-full w-full min-w-0 flex-col overflow-visible">
			<SidebarLayout.Header>
				<UprnTabBar value={currentTab} triggers={TabBarTriggers} onValueChange={onTabValueChange} />
			</SidebarLayout.Header>

			<SidebarLayout.Content>
				<div hidden={currentTab !== 'define-areas'}>
					<UprnTabBarContent>
						{#if webMapStore.isLoaded}
							<AreaSelectionTreeview
								webMap={webMapStore.data}
								treeviewStore={areaSelectionTreeviewStore}
								treeviewConfigStore={areaSelectionTreeviewConfig!}
							/>
						{/if}
					</UprnTabBarContent>
				</div>

				<div hidden={currentTab !== 'select-data'}>
					<UprnTabBarContent>
						{#if webMapStore.isLoaded}
							<DataSelectionTreeview
								webMap={webMapStore.data}
								treeviewConfigStore={dataSelectionTreeviewConfig!}
								{fieldFilterMenuStore}
							/>
						{/if}
					</UprnTabBarContent>
				</div>

				<div hidden={currentTab !== 'export'}>
					<UprnTabBarContent>
						<ExportMenu {webMapStore} {areaSelectionTreeviewStore} {fieldFilterMenuStore} />
					</UprnTabBarContent>
				</div>

				<div hidden={currentTab !== 'downloads'}>
					<UprnTabBarContent>
						{#if !uprnDownloadService || !isUprnDownloadServiceAvailable}
							<p class="p-4 text-center text-sm text-gray-500">
								Download service is not available.
							</p>
						{:else}
							<DownloadsMenu {webMapStore} {uprnDownloadService} {fieldsToHide} />
						{/if}
					</UprnTabBarContent>
				</div>
			</SidebarLayout.Content>

			<SidebarLayout.Footer>
				<div hidden={currentTab !== 'export'}>
					<ExportMenuFooter onExportSuccess={switchToDownloadsTab} />
				</div>
			</SidebarLayout.Footer>

			<Sidebar.Sidebar
				isOpen={chatSidebarOpen}
				onToggle={toggleChatSidebar}
				position={chatSidebarPosition}
				originalSize="300px"
				overlay
				openIcon={Bot}
			>
				{#snippet children()}
					{#if !aiUprnChatbotService || !isAiUprnChatbotServiceAvailable}
						<p class="p-4 text-center text-sm text-gray-500">
							AI UPRN Chatbot service is not available.
						</p>
					{:else}
						<UprnChat {aiUprnChatbotService} />
					{/if}
				{/snippet}
			</Sidebar.Sidebar>

			<!-- <ChatToggleBar /> -->
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
</Sidebar.Root>

<style>
	:global(.card-content) {
		font-size: 0.875rem;
		line-height: 1.25rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
