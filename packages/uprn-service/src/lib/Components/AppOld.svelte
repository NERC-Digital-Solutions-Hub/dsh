<script lang="ts">
	import { asset, base } from '$app/paths';
	import AreaSelectionHoverCard from '$lib/Components/AreaSelectionHoverCard/AreaSelectionHoverCard.svelte';
	import AreaSelectionToast from '$lib/Components/AreaSelectionToast/AreaSelectionToast.svelte';
	import UprnChat from '$lib/Components/chat/chat.svelte';
	import CollapsibleWindow from '$lib/Components/CollapsibleWindow/CollapsibleWindow.svelte';
	import DownloadsMenu from '$lib/Components/DownloadsMenu/DownloadsMenu.svelte';
	import ExportMenuFooter from '$lib/Components/ExportMenu/ExportMenuFooter.svelte';
	import ExportMenu from '$lib/Components/ExportMenu/ExportMenu.svelte';
	import FieldSelectionMenu from '$lib/Components/field-selection-menu/field-selection-menu.svelte';
	import ItemInfoDialog from '$lib/Components/ItemInfoDialog/ItemInfoDialog.svelte';
	import type { ResetAction } from '$lib/Components/ResetDialog/ResetDialog.svelte';
	import ResetDialog from '$lib/Components/ResetDialog/ResetDialog.svelte';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import { Toaster } from '$lib/Components/shadcn/sonner';
	import * as SidebarLayout from '$lib/Components/SidebarLayout/index.js';
	import * as Sidebar from '$lib/Components/Sidebar/index.js';
	import { SidebarPosition } from '$lib/Components/Sidebar/sidebar-position.js';
	import AreaSelectionTreeview from '$lib/Components/Treeview/Area/Treeview.svelte';
	import DataSelectionTreeview from '$lib/Components/Treeview/Data/Treeview.svelte';
	import UprnMapView from '$lib/Components/UprnMapView/UprnMapView.svelte';
	import UprnTabBarContent from '$lib/Components/UprnTabBar/UrpnTabBarContent.svelte';
	import UprnTabBar from '$lib/Components/UprnTabBar/UprnTabBar.svelte';
	import { setItemInfoDialogEvents } from '$lib/Events/ItemInfoDialogEvents';
	import { AiUprnChatbotService } from '$lib/Services/AiUprnChatbotService';
	import { ConfigTransformer } from '$lib/Services/config-api/config-transformer';
	import { CsvConfigFetcher } from '$lib/Services/config-api/csv-config-fetcher';
	import { CustomRendererService } from '$lib/Services/CustomRendererService';
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import { TabStateService } from '$lib/Services/TabStateService';
	import { TagDefinitionProvider } from '$lib/Services/TagDefinitionProvider';
	import { UprnDownloadService } from '$lib/Services/UprnDownloadService';
	import { UserStateProvider } from '$lib/Services/UserStateProvider';
	import { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
	import { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
	import { downloadsStore } from '$lib/Stores/DownloadsStore.svelte';
	import FieldFilterMenuStore from '$lib/Stores/field-filter-menu-store.svelte';
	import { SelectionTrackingStore } from '$lib/Stores/SelectionTrackingStore.svelte';
	import { TreeviewConfigStore } from '$lib/Stores/TreeviewConfigStore';
	import { uprnConfigStore } from '$lib/Stores/UprnStore.svelte';
	import { WebMapStore } from '$lib/Stores/WebMapStore.svelte';
	import type { PortalItemConfig, SizeConfig } from '$lib/Types/Configuration.types';
	import type { TreeviewConfig } from '$lib/Types/Treeview.types.js';
	import { TabProgress } from '$lib/Types/Uprn.types';
	import { Plus } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';

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

	let uprnMapView: UprnMapView | null = $state(null);

	const webMapStore: WebMapStore = new WebMapStore();
	const fieldFilterMenuStore: FieldFilterMenuStore = new FieldFilterMenuStore();

	// Maps state management
	let maps: PortalItemConfig[] = $derived(
		uprnConfigStore.instance?.mapsConfig
			.map((m) => m.value)
			.filter((v): v is PortalItemConfig => v !== undefined) ?? []
	);
	let currentMapIndex: number = $state(0);
	let currentMap: PortalItemConfig = $derived(maps[currentMapIndex]);

	let currentTab: string = $state('areas-of-interest');
	const dataSelectionStore: DataSelectionStore = new DataSelectionStore();
	const areaSelectionStore: AreaSelectionStore = new AreaSelectionStore();
	const selectionTrackingStore: SelectionTrackingStore = new SelectionTrackingStore(
		areaSelectionStore,
		dataSelectionStore,
		null
	);
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $state(null);

	let mapView: __esri.MapView | null = $state(null);
	let treeviewConfig: TreeviewConfigStore | undefined = $state();

	/** Selected tag IDs for filtering the data selection treeview. */
	let selectedTagIds: Set<string> = $state(new Set<string>());
	let customRendererService = new CustomRendererService();
	let customRendererServiceReady = $state(false);

	let itemInfoDialogOpen: boolean = $state(false);
	let itemInfoDialogActiveLayerId: string | null = $state(null);
	let resetDialogOpen: boolean = $state(false);

	let tabBarElement: HTMLElement | null = $state(null);
	let tabBarWidth: number | null = $state(null);
	let sidebarMinSize: string | undefined = $derived.by(() => {
		if (!tabBarWidth) {
			console.warn(
				'[uprn/page] Tab bar width is not available yet, using default sidebar min size'
			);
			return undefined;
		}

		console.log(`[uprn/page] Calculated sidebar min size based on tab bar width: ${tabBarWidth}px`);
		return `calc(${tabBarWidth}px + 1rem)`;
	});

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
		clearAreaSelections();
		clearDataSelections();
		clearDownloads();
	}

	function clearAreaSelections() {
		console.log('[uprn/page] Clearing area selections');
		areaSelectionStore.setLayerId(null);
		areaSelectionStore.clearSelectedAreas();
		areaSelectionInteractionStore?.cleanup();
		mapView?.graphics.removeAll();
	}

	function clearDataSelections() {
		console.log('[uprn/page] Clearing data selections');
		dataSelectionStore.clearSelections();
		selectedTagIds = new Set<string>();
	}

	function clearDownloads() {
		console.log('[uprn/page] Clearing downloads');
		downloadsStore.clearDownloads();
	}

	const resetActions: ResetAction[] = [
		{
			label: 'Clear Area Selections',
			description: 'Remove all selected areas of interest from the map',
			onReset: clearAreaSelections
		},
		{
			label: 'Clear Data Selections',
			description: 'Remove all selected data layers for export',
			onReset: clearDataSelections
		},
		{
			label: 'Clear Downloads',
			description: 'Remove all download history and pending jobs',
			onReset: clearDownloads
		},
		{
			label: 'Clear All',
			description: 'Removes all selections and download history',
			onReset: clearAllSelections
		}
	];

	function observeTabbarSize(node: HTMLElement) {
		const resizeObserver = new ResizeObserver(([entry]) => {
			console.log(`[uprn/page] Tab bar width changed: ${entry.contentRect.width}px`);
			tabBarWidth = entry.contentRect.width;

			console.log(
				`[uprn/page] Updated sidebar min size based on new tab bar width: ${tabBarWidth}`
			);
		});

		resizeObserver.observe(node);

		return {
			destroy() {
				resizeObserver.disconnect();
			}
		};
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

		const datasetsCsvPath = asset('/config/apps/uprn/api/datasets.csv');
		const variablesCsvPath = asset('/config/apps/uprn/api/variables.csv');
		const foldersCsvPath = asset('/config/apps/uprn/api/folders.csv');
		const configFetcher = new CsvConfigFetcher(datasetsCsvPath, variablesCsvPath, foldersCsvPath);
		const { folders, datasets, variables } = await configFetcher.fetch();
		const configTransformer = new ConfigTransformer();
		const treeviewNodes = await configTransformer.transform({ folders, datasets, variables });
		currentMap.treeview.layers = treeviewNodes;

		const { default: MapView } = await import('@arcgis/core/views/MapView');
		mapView = new MapView();

		areaSelectionInteractionStore = new AreaSelectionInteractionStore(
			areaSelectionStore,
			new LayerViewProvider(mapView),
			[]
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
		const anyAreaSelected = areaSelectionStore.areaIds.size > 0;
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
{#if treeviewConfig}
	<ItemInfoDialog
		layerViewProvider={webMapStore}
		nodeConfigProvider={treeviewConfig}
		bind:isOpen={itemInfoDialogOpen}
		bind:activeLayerId={itemInfoDialogActiveLayerId}
	/>
{/if}
{#if areaSelectionInteractionStore}
	<AreaSelectionHoverCard {areaSelectionInteractionStore} />
	<AreaSelectionToast {areaSelectionInteractionStore} />
{/if}

<Sidebar.Root
	isOpen={mainSidebarOpen}
	minSize={sidebarMinSize}
	onToggle={toggleMainSidebar}
	position={mainSidebarPosition}
>
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
					<!-- <div class="tabs-center">
						<div class="tabbar-anchor" bind:this={tabBarElement} use:observeTabbarSize>
							<UprnTabBar
								value={currentTab}
								triggers={tabBarTriggers}
								progressByValue={tabProgressByValue}
								onValueChange={onTabValueChange}
							/>

							<div class="reset-anchor">
								<ResetDialog
									bind:open={resetDialogOpen}
									actions={resetActions}
									buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
								/>
							</div>
						</div>
					</div> -->
					<div class="tabs-center">
						<div class="tabbar-anchor" bind:this={tabBarElement} use:observeTabbarSize>
							<UprnTabBar
								value={currentTab}
								triggers={tabBarTriggers}
								progressByValue={tabProgressByValue}
								onValueChange={onTabValueChange}
							>
								| <ResetDialog
									bind:open={resetDialogOpen}
									actions={resetActions}
									buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
								/>
							</UprnTabBar>
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
									nodeConfigProvider={treeviewConfig!}
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
									nodeConfigProvider={treeviewConfig!}
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
									nodeConfigProvider={treeviewConfig!}
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
								clearSelections={() => (resetDialogOpen = true)}
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
