<script lang="ts">
	import AreaSelectionHoverCard from '$lib/components/area-selection-hover-card/area-selection-hover-card.svelte';
	import AreaSelectionToast from '$lib/components/area-selection-toast/area-selection-toast.svelte';
	import UprnChat from '$lib/components/chat/chat.svelte';
	import DownloadsMenu from '$lib/components/downloads-menu/downloads-menu.svelte';
	import ExportMenuFooter from '$lib/components/export-menu/export-menu-footer.svelte';
	import ExportMenu from '$lib/components/export-menu/export-menu.svelte';
	import FieldSelectionMenu from '$lib/components/field-selection-menu/field-selection-menu.svelte';
	import AreaSelectionTreeview from '$lib/components/tree-view/area-selection/tree-view.svelte';
	import DataSelectionTreeview from '$lib/components/tree-view/data-selection/tree-view.svelte';
	import TreeviewTags from '$lib/components/treeview-tags/treeview-tags.svelte';
	import UprnMapView from '$lib/components/uprn-map-view/uprn-map-view.svelte';
	import UprnTabBarContent from '$lib/components/uprn-tab-bar/uprn-tab-bar-content.svelte';
	import UprnTabBar from '$lib/components/uprn-tab-bar/uprn-tab-bar.svelte';
	import * as Sidebar from '$lib/components/sidebar/index.js';
	import * as SidebarLayout from '$lib/components/sidebar-layout/index.js';
	import * as Card from '$lib/components/shadcn/card/index.js';
	import { SidebarPosition } from '$lib/components/sidebar/sidebar-position.js';
	import { Toaster } from '$lib/components/shadcn/sonner';
	import { AreaSelectionStore } from '$lib/stores/area-selection-store.svelte';
	import { AreaSelectionInteractionStore } from '$lib/stores/area-selection-interaction-store.svelte';
	import FieldFilterMenuStore from '$lib/stores/field-filter-menu-store.svelte';
	import { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';
	import type { PortalItemConfig, SizeConfig } from '$lib/types/config';
	import type { TreeviewConfig } from '$lib/types/treeview.js';
	import { onDestroy, onMount } from 'svelte';
	import { DataSelectionStore } from '$lib/stores/data-selection-store.svelte';
	import { UprnDownloadService } from '$lib/services/uprn-download-service';
	import { AiUprnChatbotService } from '$lib/services/ai-uprn-chatbot-service';
	import { CustomRendererService } from '$lib/services/custom-renderer-service';
	import CollapsibleWindow from '$lib/components/collapsible-window/collapsible-window.svelte';
	import { asset, base } from '$app/paths';
	import { LayerViewProvider } from '$lib/services/layer-view-provider';
	import { SelectionTrackingStore } from '$lib/stores/selection-tracking-store.svelte';
	import SettingsDialog from '$lib/components/settings-dialog/settings-dialog.svelte';
	import ResetDialog from '$lib/components/reset-dialog/reset-dialog.svelte';
	import { uprnConfigStore } from '$lib/stores/uprn-store.svelte';
	import ItemInfoDialog from '$lib/components/item-info-dialog/item-info-dialog.svelte';
	import { setItemInfoDialogEvents } from '$lib/events/item-info-dialog-events';
	import { Plus, Slash } from '@lucide/svelte';
	import { TabProgress } from '$lib/types/uprn';
	import { TabStateService } from '$lib/services/TabStateService';
	import { UserStateProvider } from '$lib/services/UserStateProvider';
	import { TagDefinitionProvider } from '$lib/services/TagDefinitionProvider';

	const tabBarTriggers = [
		{
			value: 'areas-of-interest',
			label: 'Areas of Interest',
			tooltip: 'Select areas of interest on the map',
			seperatorIcon: Plus
		},
		{
			value: 'select-data',
			label: 'Select Data',
			tooltip: 'Select data layers for export'
		},
		{
			value: 'export',
			label: 'Export',
			tooltip: 'Export selected data confined to selected areas'
		},
		{
			value: 'downloads',
			label: 'Download',
			tooltip: 'Download your exported data',
			hasProgress: false
		}
	];

	const tabStateService = new TabStateService('areas-of-interest');
	let userStateProvider: UserStateProvider | null = $state(null);
	let tagDefinitionProvider: TagDefinitionProvider | null = $state(null);

	let tabProgressByValue: Record<string, TabProgress | undefined> = $state({});

	let areaSelectionTreeview: DataSelectionTreeview | null = $state(null);
	let dataSelectionTreeview: DataSelectionTreeview | null = $state(null);
	let uprnMapView: UprnMapView | null = $state(null);

	const webMapStore: WebMapStore = $state(new WebMapStore());
	const fieldFilterMenuStore: FieldFilterMenuStore = $state(new FieldFilterMenuStore());

	// Maps state management
	let maps: PortalItemConfig[] = $derived(
		uprnConfigStore.instance?.mapsConfig
			.map((m) => m.value)
			.filter((v): v is PortalItemConfig => v !== undefined) ?? []
	);
	let currentMapIndex: number = $state(0);
	let currentMap: PortalItemConfig = $derived(maps[currentMapIndex]);

	let currentTab: string = $state('areas-of-interest');
	let dataSelectionStore: DataSelectionStore = $state(new DataSelectionStore());
	let areaSelectionStore: AreaSelectionStore = $state(new AreaSelectionStore());
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $state(null);
	let selectionTrackingStore: SelectionTrackingStore = $state(
		new SelectionTrackingStore(areaSelectionStore, dataSelectionStore)
	);

	let mapView: __esri.MapView | null = $state(null);
	let treeviewConfig: TreeviewConfigStore | undefined = $state();

	/** Selected tag IDs for filtering the data selection treeview. */
	let selectedTagIds: Set<string> = $state(new Set<string>());
	let customRendererService = new CustomRendererService();
	let customRendererServiceReady = $state(false);

	let itemInfoDialogOpen: boolean = $state(false);
	let itemInfoDialogActiveLayerId: string | null = $state(null);
	let resetDialogOpen: boolean = $state(false);

	let dataSelectionCount: number = $derived(dataSelectionStore.dataSelections.size);

	let uprnDownloadApi = $derived(
		uprnConfigStore.instance?.uprnDownloadApiConfig.value
			? new UprnDownloadService(uprnConfigStore.instance.uprnDownloadApiConfig.value)
			: undefined
	);

	let aiUprnChatbotApi = $derived(
		uprnConfigStore.instance?.uprnChatbotApiConfig.value
			? new AiUprnChatbotService(uprnConfigStore.instance.uprnChatbotApiConfig.value)
			: undefined
	);

	let isUprnDownloadServiceAvailable: boolean = $state(false);
	let isAiUprnChatbotServiceAvailable: boolean = $state(false);
	let fieldsToHide: Set<string> = $state(new Set());
	let selectionLayers: Set<string> = $state(new Set());

	// === Sidebar State ===
	let mainSidebarOpen = $state(true);
	let mainSidebarPosition = $state<Sidebar.PositionType>(SidebarPosition.LEFT);
	let mainSidebarSizes: SizeConfig[] = $derived(uprnConfigStore.instance?.mainSidebarSizes ?? []);
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);

	// === Derived State for Responsive Sidebar Sizing ===

	/**
	 * Derives the original size (initial size) based on window width and breakpoints.
	 */
	let mainSidebarOriginalSize = $derived.by(
		() => getMatchingSize(mainSidebarSizes, (config) => config.originalSize) ?? '300px'
	);

	/**
	 * Derives the minimum size (for resizing) based on window width and breakpoints.
	 */
	let mainSidebarMinSize = $derived.by(
		() => getMatchingSize(mainSidebarSizes, (config) => config.minSize) ?? '200px'
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
	 * Sets the progress state for a specific tab.
	 * @param tabValue - The value of the tab to update
	 * @param progress - The new progress state to set
	 */
	function setTabProgress(tabValue: string, progress: TabProgress) {
		tabProgressByValue[tabValue] = progress;
	}

	/**
	 * Handles tab value changes and updates the current tab state.
	 * @param value - The new tab value to switch to
	 */
	function onTabValueChange(value: string) {
		currentTab = value;
		tabStateService.setCurrentTab(value);
		console.log(`[uprn/page] Switched to tab: ${value}`);
		console.log('[uprn/page] Current user state:', userStateProvider?.getUserState());
	}

	function setMapIndex(index: number) {
		if (index < 0 || index >= maps.length) {
			console.warn(`[uprn/page] Invalid map index: ${index}`);
			return;
		}

		clearAllSelections();

		onTabValueChange('areas-of-interest');

		// Reset webmap store to force reload
		webMapStore.data = null;
		webMapStore.isLoaded = false;

		currentMapIndex = index;
	}

	/**
	 * Checks the availability of the UPRN Download Service.
	 */
	function checkDownloadServiceAvailability() {
		if (!uprnDownloadApi || isUprnDownloadServiceAvailable) {
			return;
		}

		uprnDownloadApi.getHealth().then((available) => {
			isUprnDownloadServiceAvailable = available;
			if (available) console.log('[uprn/page] UPRN Download Service is available');
			else console.warn('[uprn/page] UPRN Download Service is NOT available');
		});
	}

	function clearAllSelections() {
		console.log('[uprn/page] Clearing all selections');
		areaSelectionStore.setLayerId(null);
		areaSelectionStore.clearSelectedAreas();
		dataSelectionStore.clearSelections();
		areaSelectionTreeview?.clearSelections();
		dataSelectionTreeview?.clearSelections();
		mapView?.graphics.removeAll();
		selectedTagIds = new Set<string>();
	}

	function requestClearAllSelections() {
		resetDialogOpen = true;
	}

	/**
	 * Initializes the application by loading configuration and setting up stores.
	 */
	onMount(async () => {
		try {
			await uprnConfigStore.load(`${base}/config/apps/uprn/config.json`);
		} catch (error) {
			console.error('[uprn/page] Failed to load UPRN config', error);
		}

		const { default: MapView } = await import('@arcgis/core/views/MapView');
		mapView = new MapView();

		areaSelectionInteractionStore = new AreaSelectionInteractionStore(
			areaSelectionStore,
			new LayerViewProvider(mapView)
		);

		userStateProvider = new UserStateProvider(
			tabStateService,
			areaSelectionStore,
			dataSelectionStore,
			webMapStore
		);

		tagDefinitionProvider = new TagDefinitionProvider(currentMap.tagDefinitions || []);
	});

	$effect(() => {
		if (currentTab === 'downloads') {
			checkDownloadServiceAvailability();
		}
	});

	$effect(() => {
		if (uprnDownloadApi) {
			uprnDownloadApi.getHealth().then((available) => {
				isUprnDownloadServiceAvailable = available;
				if (available) console.log('[uprn/page] UPRN Download Service is available');
				else console.warn('[uprn/page] UPRN Download Service is NOT available');
			});
		} else {
			isUprnDownloadServiceAvailable = false;
		}
	});

	$effect(() => {
		if (aiUprnChatbotApi) {
			aiUprnChatbotApi.getHealth().then((available) => {
				isAiUprnChatbotServiceAvailable = available;
				if (available) console.log('[uprn/page] AI UPRN Chatbot Service is available');
				else console.warn('[uprn/page] AI UPRN Chatbot Service is NOT available');
			});
		} else {
			isAiUprnChatbotServiceAvailable = false;
		}
	});

	/**
	 * Effect to reinitialize map-dependent components when currentMapIndex changes.
	 * This allows for easy switching between different map configurations.
	 */
	$effect(() => {
		if (!currentMap || !mapView || !areaSelectionInteractionStore) {
			return;
		}

		console.log(`[uprn/page] Loading map ${currentMapIndex + 1} of ${maps.length}`);

		if (currentMap.customRenderers) {
			customRendererServiceReady = false;
			const customRendererPath = asset(currentMap.customRenderers);
			customRendererService
				.init(customRendererPath)
				.then(() => (customRendererServiceReady = true))
				.catch((e) => console.error('[uprn/page] Failed to load custom renderers', e));
		}

		// Update selection layers and field infos
		selectionLayers = new Set((currentMap.selectableLayers || []).map((s) => s.id));
		areaSelectionInteractionStore.setFieldInfos(currentMap.selectableLayers || []);

		// Update treeview configurations
		treeviewConfig = new TreeviewConfigStore(
			$state.snapshot(currentMap.treeview) as TreeviewConfig
		);

		// Update fields to hide
		fieldsToHide = new Set(currentMap.treeview?.fieldsToHide || []);

		// Initialize the web map with new configuration
		webMapStore.initializeAsync({
			portalUrl: currentMap.portalUrl,
			itemId: currentMap.portalItemId || '',
			proxy: currentMap.proxy
		});
	});

	$effect(() => {
		// don't invoke selection loading until the web map is loaded
		if (!webMapStore.isLoaded || !currentMap) {
			return;
		}

		selectionTrackingStore.portalItemId = currentMap.portalItemId || null;
	});

	$effect(() => {
		const anyAreaSelected = areaSelectionStore.selectedAreaIds.size > 0;
		const anyDataSelected = dataSelectionStore.dataSelections.size > 0;

		setTabProgress(
			'areas-of-interest',
			anyAreaSelected ? TabProgress.Completed : TabProgress.NotStarted
		);

		setTabProgress('select-data', anyDataSelected ? TabProgress.Completed : TabProgress.NotStarted);

		setTabProgress(
			'export',
			anyAreaSelected && anyDataSelected
				? TabProgress.Completed
				: anyAreaSelected || anyDataSelected
					? TabProgress.InProgress
					: TabProgress.NotStarted
		);
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
		dataSelectionStore.cleanup();
	});

	function onOpenInfoDialog(layerId: string) {
		itemInfoDialogActiveLayerId = layerId;
		itemInfoDialogOpen = true;
	}

	setItemInfoDialogEvents({
		onOpenInfoDialog
	});
</script>

<Toaster />
<FieldSelectionMenu {dataSelectionStore} {fieldFilterMenuStore} {fieldsToHide} />
<ItemInfoDialog
	webmapService={webMapStore}
	bind:isOpen={itemInfoDialogOpen}
	bind:activeLayerId={itemInfoDialogActiveLayerId}
/>
{#if areaSelectionInteractionStore}
	<AreaSelectionHoverCard {areaSelectionInteractionStore} />
	<AreaSelectionToast {areaSelectionInteractionStore} />
{/if}

<Sidebar.Root isOpen={mainSidebarOpen} onToggle={toggleMainSidebar} position={mainSidebarPosition}>
	{#snippet sidebarContent()}
		<div
			class="relative flex h-full w-full min-w-0 flex-col gap-1 overflow-visible bg-slate-200 pt-1 px-1"
		>
			<Card.Root
				class="relative flex flex-1 flex-col overflow-hidden rounded-md gap-0 py-0 shadow-none bg-slate-50"
			>
				<!-- <div class="absolute top-0 left-0 z-10 flex gap-1 ml-1 mt-1">
					<SettingsDialog
						{maps}
						{currentMapIndex}
						onSelectMap={setMapIndex}
						buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
					/>

					<ResetDialog
						bind:open={resetDialogOpen}
						onReset={clearAllSelections}
						buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
					/>
				</div> -->

				<SidebarLayout.Header>
					<div class="tabs-center">
						<div class="tabbar-anchor">
							<UprnTabBar
								value={currentTab}
								triggers={tabBarTriggers}
								progressByValue={tabProgressByValue}
								onValueChange={onTabValueChange}
							/>

							<div class="reset-anchor">
								<ResetDialog
									bind:open={resetDialogOpen}
									onReset={clearAllSelections}
									buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
								/>
							</div>
						</div>
					</div>
				</SidebarLayout.Header>

				<SidebarLayout.Content>
					<div hidden={currentTab !== 'areas-of-interest'}>
						<UprnTabBarContent>
							{#if webMapStore.isLoaded}
								<AreaSelectionTreeview
									bind:this={areaSelectionTreeview}
									webMap={webMapStore.data!}
									treeviewConfigStore={treeviewConfig!}
									layerViewProvider={uprnMapView?.getLayerViewProvider()!}
									{areaSelectionStore}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== 'select-data'}>
						<UprnTabBarContent>
							{#if webMapStore.isLoaded && customRendererServiceReady}
								<!-- <TreeviewTags
									tasgDefinitionProvider={tagDefinitionProvider ?? undefined}
									class="justify-center"
									bind:selectedTagIds
								/> -->
								<DataSelectionTreeview
									bind:this={dataSelectionTreeview}
									webMap={webMapStore.data!}
									{dataSelectionStore}
									layerViewProvider={uprnMapView?.getLayerViewProvider()!}
									treeviewConfigStore={treeviewConfig!}
									tagDefinitionProvider={tagDefinitionProvider!}
									{customRendererService}
									{fieldFilterMenuStore}
									{selectedTagIds}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== 'export'}>
						<UprnTabBarContent>
							{#if areaSelectionInteractionStore && webMapStore.isLoaded}
								<ExportMenu
									webMapService={webMapStore}
									{areaSelectionInteractionStore}
									{dataSelectionStore}
									dataSelectionTreeviewConfig={treeviewConfig!}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== 'downloads'}>
						<UprnTabBarContent>
							{#if !uprnDownloadApi || !isUprnDownloadServiceAvailable || !webMapStore.isLoaded}
								<p class="p-4 text-center text-sm text-gray-500">
									Download service is not available.
								</p>
							{:else}
								<DownloadsMenu uprnDownloadService={uprnDownloadApi} {fieldsToHide} />
							{/if}
						</UprnTabBarContent>
					</div>
				</SidebarLayout.Content>
				<SidebarLayout.Footer>
					<div hidden={currentTab !== 'export'}>
						{#if areaSelectionInteractionStore}
							<ExportMenuFooter
								onExportSuccess={() => onTabValueChange('downloads')}
								clearSelections={requestClearAllSelections}
								{areaSelectionInteractionStore}
								{dataSelectionStore}
							/>
						{/if}
					</div>
				</SidebarLayout.Footer>
			</Card.Root>

			<CollapsibleWindow isOpenedOnInit={true} class="mt-0 shadow-none">
				{#if !aiUprnChatbotApi || !isAiUprnChatbotServiceAvailable}
					<p class="p-4 text-center text-sm text-gray-500">
						AI UPRN Chatbot service is not available.
					</p>
				{:else}
					<UprnChat aiUprnChatbotService={aiUprnChatbotApi} />
				{/if}
			</CollapsibleWindow>
		</div>
	{/snippet}

	{#snippet mainContent()}
		{#if areaSelectionInteractionStore}
			<UprnMapView
				bind:this={uprnMapView}
				webMap={webMapStore.data!}
				mapView={mapView!}
				{areaSelectionInteractionStore}
				interactableLayers={selectionLayers}
			/>
		{/if}
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
	.tabs-center {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	/* This box should match the tab bar width (so button anchors to it) */
	.tabbar-anchor {
		position: relative;
		display: inline-block; /* shrink-wrap to UprnTabBar */
	}

	/* Button positioned relative to the tab bar’s right edge */
	.reset-anchor {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translate(calc(100% + 0.25rem), -50%);
		z-index: 10;
	}
</style>
