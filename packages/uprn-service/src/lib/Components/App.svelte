<script lang="ts">
	import AppMapPane from '$lib/Components/App/AppMapPane.svelte';
	import AppOverlays from '$lib/Components/App/AppOverlays.svelte';
	import AreaSelectionPanel from '$lib/Components/App/AreaSelectionPanel.svelte';
	import ChatAvailabilityPanel from '$lib/Components/App/ChatAvailabilityPanel.svelte';
	import DataSelectionPanel from '$lib/Components/App/DataSelectionPanel.svelte';
	import DownloadsPanel from '$lib/Components/App/DownloadsPanel.svelte';
	import ExportReviewPanel from '$lib/Components/App/ExportReviewPanel.svelte';
	import TabHeaderActions from '$lib/Components/App/TabHeaderActions.svelte';
	import CollapsibleWindow from '$lib/Components/CollapsibleWindow/CollapsibleWindow.svelte';
	import ExportMenuFooter from '$lib/Components/ExportMenu/ExportMenuFooter.svelte';
	import type { ResetAction } from '$lib/Components/ResetDialog/ResetDialog.svelte';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import * as Tabs from '$lib/Components/shadcn/tabs/index.js';
	import * as SidebarLayout from '$lib/Components/SidebarLayout/index.js';
	import * as Sidebar from '$lib/Components/Sidebar/index.js';
	import UprnTabBarContent from '$lib/Components/UprnTabBar/UprnTabBarContent.svelte';
	import UprnTabBar from '$lib/Components/UprnTabBar/UprnTabBar.svelte';
	import { clearUprnDatabase } from '$lib/Persistence/UprnDatabase';
	import { setItemInfoContext } from '$lib/Components/ItemInfoDialog/ItemInfoContext';
	import { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import { ArcgisNodeStyleRenderer } from '$lib/Services/ArcgisNodeStyleRenderer';
	import { ArcgisNodeVisibilityRenderer } from '$lib/Services/ArcgisNodeVisibilityRenderer';
	import { CustomRendererService } from '$lib/Services/CustomRendererService';
	import { AreaSelectionLimitsController } from '$lib/Services/AreaSelectionLimitsController.svelte';
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import { NodeVisibilityController } from '$lib/Services/NodeVisibilityController.svelte';
	import { createTreeviewRuntime } from '$lib/Services/createTreeviewRuntime';
	import { ServiceHealthController } from '$lib/Services/ServiceHealthController.svelte';
	import { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
	import { DataSelectionStore } from '$lib/Stores/DataSelectionStore.svelte';
	import DownloadsStore from '$lib/Stores/DownloadsStore.svelte';
	import { createSelectionPersistence } from '$lib/Stores/SelectionPersistence.svelte';
	import {
		describeWebMapSource,
		getWebMapSourcePersistenceKey,
		WebMapStore
	} from '$lib/Stores/WebMapStore.svelte';
	import { arcgisImport } from '@dsh/common/arcgis';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import { TabProgress, TabType, type DownloadEntry } from '$lib/Types/Uprn.types';
	import { installBrowserPolyfills } from '$lib/Utilities/browser-polyfills';
	import { Plus } from '@lucide/svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { AppsUprnConfig, ChatbotConfig } from '$lib/Types/Configuration.types';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';

	installBrowserPolyfills();

	type Props = {
		config: AppsUprnConfig;
		defaultSourceIndex?: number;
	};

	let { config, defaultSourceIndex }: Props = $props();

	const tabBarTriggers = [
		{
			value: TabType.AreaOfInterest,
			label: 'Areas of Interest',
			tooltip: 'Select areas of interest on the map',
			separatorIcon: Plus
		},
		{
			value: TabType.Data,
			label: 'Select Data',
			tooltip: 'Select data layers for export'
		},
		{
			value: TabType.Export,
			label: 'Export',
			tooltip: 'Export selected data confined to selected areas'
		},
		{
			value: TabType.Downloads,
			label: 'Download',
			tooltip: 'Download your exported data',
			hasProgress: false
		}
	];

	const resetActions: ResetAction[] = [
		{
			label: 'Clear Area Selections',
			description: 'Remove all selected areas of interest from the map.',
			variant: 'outline',
			onReset: clearAreaSelections
		},
		{
			label: 'Clear Data Selections',
			description: 'Remove all selected data layers for export.',
			variant: 'outline',
			onReset: clearDataSelections
		},
		{
			label: 'Clear Downloads',
			description: 'Remove all download history and pending jobs.',
			variant: 'outline',
			onReset: clearDownloads
		},
		{
			label: 'Reset',
			description: 'Resets the app to its initial state.',
			variant: 'destructive',
			onReset: clearAllSelections
		}
	];

	const dataSelectionStore: DataSelectionStore = new DataSelectionStore();
	const areaSelectionStore: AreaSelectionStore = new AreaSelectionStore();
	const downloadsStore: DownloadsStore = new DownloadsStore();
	const persistentUprnVisibilityGroupId = 'group:uprn';

	const appConfig = {
		get content() {
			return config;
		},
		get error() {
			return null;
		},
		get isLoading() {
			return false;
		}
	};

	/** State to track whether initial node visibility has been set. */
	let initializedNodeVisibility = $state(false);

	/** State to manage the visibility of the sidebar. */
	let sidebarOpen = $state(true);

	/** State for managing the visibility of the introduction dialog. */
	let introductionDialogOpen = $state(false);

	/** State for managing the visibility of the item info dialog. */
	let itemInfoDialogOpen: boolean = $state(false);

	/** State for tracking the currently active layer ID in the item info dialog. */
	let itemInfoDialogActiveLayerId: string | null = $state(null);

	/** State for managing the visibility of the reset dialog. */
	let resetDialogOpen: boolean = $state(false);

	/** State for managing the visibility of the download info dialog. */
	let downloadInfoDialogOpen: boolean = $state(false);

	/** State for tracking the selected download shown in the download info dialog. */
	let activeDownloadInfo: DownloadEntry | null = $state(null);

	/** State for managing the current active tab. */
	let currentTab: TabType = $state(TabType.AreaOfInterest);

	/** State for tracking tabs that have been mounted at least once. */
	const mountedTabs: Set<TabType> = new SvelteSet<TabType>([TabType.AreaOfInterest]);

	/** State for tracking the tab bar progress that contains the tabs the user has visited. */
	let tabProgressByValue: Record<string, TabProgress | undefined> = $state({});

	/** State for tracking the tab bar width. */
	let tabBarWidth: number | null = $state(null);

	/** State of the ArcGIS MapView instance. */
	let mapView: __esri.MapView | null = $state(null);

	let appRunGeneration = 0;
	let appDestroyed = false;
	let webMapStoreResetKey = $state(0);
	let attachedVisibilityController: NodeVisibilityController | null = null;
	let attachedVisibilityMapView: __esri.MapView | null = null;

	let aiUprnChatbotHealth = $state<ServiceHealthController | null>(null);
	let uprnDownloadHealth = $state<ServiceHealthController | null>(null);

	/** Index of the active web map source (resets to the default on each load). */
	let selectedMapSourceIndex = $state(untrack(() => defaultSourceIndex ?? 0));
	let lastAppliedDefaultSourceIndex: number | null = null;

	/** Tracks failed sources so the app only falls forward through configured map sources once. */
	const failedWebMapSourceKeys: Set<string> = new SvelteSet<string>();

	/** Error message shown when all configured web map sources fail to load. */
	let webMapLoadErrorMessage: string | null = $state(null);

	/** The currently selected web map source, falling back to the default. */
	const selectedMapSource = $derived.by(() => {
		const sources = appConfig.content?.map.sources;
		if (!sources?.length) {
			return null;
		}

		return sources[selectedMapSourceIndex] ?? sources[defaultSourceIndex ?? 0];
	});

	/** Portal item used by the download API, independent of the active display source. */
	const downloadPortalItemId = $derived.by(() => {
		return (
			appConfig.content?.map.sources.find((source) => source.kind === 'portal-item')?.itemId ?? null
		);
	});

	/** Stable key used to persist selections for portal, static, and API-backed webmaps. */
	const webMapPersistenceKey: string | null = $derived.by(() => {
		if (!selectedMapSource) {
			return null;
		}

		return getWebMapSourcePersistenceKey(selectedMapSource);
	});

	let areaSelectionLimits = $state<AreaSelectionLimitsController | null>(null);

	/** Derived state to create a map of area selection limits by layer ID for easy lookup. */
	const areaSelectionLimitsMap: Map<string, number> = $derived.by(() => {
		if (!areaSelectionLimits || !areaSelectionLimits.content) {
			return new SvelteMap<string, number>();
		}

		const map = new SvelteMap<string, number>();
		areaSelectionLimits.content.layers.forEach((limit) => {
			map.set(limit.layerId, limit.areaLimit);
		});
		return map;
	});

	const introductionMarkdown: string | null = $derived(
		appConfig.content?.content.introductionMarkdown ?? null
	);

	const settings = $derived(appConfig.content?.content.settings ?? null);

	/** Derived state for the chatbot settings. */
	const chatbotSettings: ChatbotConfig | null = $derived.by(() => {
		if (!settings?.chatbot) {
			return null;
		}

		console.log('[uprn/app] Fetched general settings:', settings);
		return settings.chatbot;
	});

	let webMapStore: WebMapStore | null = $state(null);
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $state(null);

	const customRendererService = untrack(
		() => new CustomRendererService(config.content.customRenderers)
	);
	const interactableLayers = untrack(
		() => new SvelteSet(config.map.selectableLayers?.map((layer) => layer.id) ?? [])
	);
	const treeviewRuntime = untrack(() =>
		createTreeviewRuntime(config.treeviewConfig, dataSelectionStore)
	);
	const {
		configStore: treeviewConfigStore,
		nodes: treeviewNodes,
		nodeProvider: treeviewNodeProvider,
		areaNodes: areaTreeviewNodes,
		dataNodes: dataTreeviewNodes,
		selectionController: dataNodeSelectionController,
		visibilityController: nodeVisibilityController,
		areaTreeviewStore,
		dataTreeviewStore
	} = treeviewRuntime;
	const selectionPersistence = createSelectionPersistence({
		getPersistenceKey: () => webMapPersistenceKey,
		getVisibilityInitialized: () => initializedNodeVisibility,
		areaSelectionStore,
		dataSelectionStore,
		nodeProvider: treeviewNodeProvider,
		visibilityController: nodeVisibilityController,
		selectionController: dataNodeSelectionController
	});

	/** The minimum size of the sidebar.  */
	let sidebarMinSize: string | undefined = $derived.by(() => {
		return typeof tabBarWidth === 'number' ? `calc(${tabBarWidth}px + 1rem)` : undefined;
	});

	/** Determines whether the area treeview can be rendered based on the availability of required dependencies. */
	let loadAreaTreeview: boolean = $derived(
		!!(areaTreeviewNodes && areaTreeviewStore && treeviewConfigStore)
	);

	/** Determines whether the data treeview can be rendered based on the availability of required dependencies. */
	let loadDataTreeview: boolean = $derived(
		!!(dataTreeviewNodes && dataTreeviewStore && treeviewConfigStore)
	);

	/** Determines whether the export menu can be rendered based on the availability of required dependencies. */
	let loadExportMenu: boolean = $derived(
		!!(areaSelectionInteractionStore && treeviewNodeProvider && treeviewConfigStore)
	);

	/** True when any data layer is currently visible on the map. */
	let hasVisibleDataLayer: boolean = $derived.by(() => {
		return getVisibleDataLayerNodeIds().length > 0;
	});

	onMount(() => {
		startApp();
	});

	onDestroy(() => {
		cleanupRuntimeState({ destroyWebMap: true, markDestroyed: true });
	});

	$effect(() => {
		const endpoints = appConfig.content?.aiUprnChatbot;
		if (!endpoints) {
			aiUprnChatbotHealth = null;
			return;
		}
		const controller = new ServiceHealthController(`${endpoints.baseUrl}${endpoints.healthRoute}`);
		aiUprnChatbotHealth = controller;
		void controller.fetch();
		return () => {
			controller.destroy();
			if (aiUprnChatbotHealth === controller) aiUprnChatbotHealth = null;
		};
	});

	$effect(() => {
		const endpoints = appConfig.content?.uprnDownload;
		if (!endpoints) {
			uprnDownloadHealth = null;
			return;
		}
		const controller = new ServiceHealthController(
			`${endpoints.baseUrl}${endpoints.healthRoute}`,
			'include'
		);
		uprnDownloadHealth = controller;
		void controller.fetch();
		return () => {
			controller.destroy();
			if (uprnDownloadHealth === controller) uprnDownloadHealth = null;
		};
	});

	$effect(() => {
		const endpoints = appConfig.content?.uprnDownload;
		const portalItemId = downloadPortalItemId;
		const selectableLayers = appConfig.content?.map.selectableLayers;
		if (!endpoints || !portalItemId || !selectableLayers) {
			areaSelectionLimits = null;
			return;
		}
		const controller = new AreaSelectionLimitsController(
			`${endpoints.baseUrl}${endpoints.getAreaSelectionLimitsRoute}`,
			portalItemId,
			selectableLayers.map((layer) => layer.id)
		);
		areaSelectionLimits = controller;
		void controller.fetch();
		return () => {
			controller.destroy();
			if (areaSelectionLimits === controller) areaSelectionLimits = null;
		};
	});

	$effect(() => {
		void webMapStoreResetKey;
		const source = selectedMapSource;
		if (!source) {
			webMapStore = null;
			return;
		}

		const store = new WebMapStore({ source, proxy: undefined });
		webMapStore = store;

		return () => {
			if (webMapStore === store) webMapStore = null;
			void store.destroy();
		};
	});

	$effect(() => {
		const activeMapView = mapView;
		if (!activeMapView) {
			areaSelectionInteractionStore = null;
			return;
		}

		const interactionStore = new AreaSelectionInteractionStore(
			areaSelectionStore,
			new LayerViewProvider(activeMapView),
			config.map.selectableLayers ?? [],
			webMapStore
		);
		areaSelectionInteractionStore = interactionStore;

		return () => {
			interactionStore.cleanup();
			if (areaSelectionInteractionStore === interactionStore) {
				areaSelectionInteractionStore = null;
			}
		};
	});

	$effect(() => {
		const nextDefaultSourceIndex = defaultSourceIndex ?? 0;
		if (lastAppliedDefaultSourceIndex === null) {
			lastAppliedDefaultSourceIndex = nextDefaultSourceIndex;
			return;
		}

		if (nextDefaultSourceIndex === lastAppliedDefaultSourceIndex) {
			return;
		}

		lastAppliedDefaultSourceIndex = nextDefaultSourceIndex;
		selectedMapSourceIndex = nextDefaultSourceIndex;
		startApp();
	});

	$effect(() => {
		if (!settings?.enableIntroductionPopup) {
			return;
		}

		console.log('[uprn/app] Introduction popup enabled, showing dialog');
		introductionDialogOpen = true;
	});

	/**
	 * Falls back to the next configured map source if the current source fails to load.
	 */
	$effect(() => {
		if (!webMapStore?.error || !selectedMapSource) {
			webMapLoadErrorMessage = null;
			return;
		}

		const currentSourceKey = getWebMapSourcePersistenceKey(selectedMapSource);
		const currentSourceLabel = describeWebMapSource(selectedMapSource);

		if (!failedWebMapSourceKeys.has(currentSourceKey)) {
			failedWebMapSourceKeys.add(currentSourceKey);
			console.error('[uprn/app] Web map source failed', {
				source: currentSourceLabel,
				error: webMapStore.error
			});
		}

		const sources = appConfig.content?.map.sources ?? [];
		const nextSourceIndex = sources.findIndex((source, index) => {
			return (
				index > selectedMapSourceIndex &&
				!failedWebMapSourceKeys.has(getWebMapSourcePersistenceKey(source))
			);
		});

		if (nextSourceIndex !== -1) {
			const nextSource = sources[nextSourceIndex];
			console.warn('[uprn/app] Falling back to next web map source', {
				from: currentSourceLabel,
				to: describeWebMapSource(nextSource)
			});
			webMapLoadErrorMessage = null;
			selectedMapSourceIndex = nextSourceIndex;
			return;
		}

		webMapLoadErrorMessage = webMapStore.error;
	});

	/** Effect to set initial visibility of treeview nodes based on their configurations when they are loaded. */
	$effect(() => {
		if (
			initializedNodeVisibility ||
			!nodeVisibilityController ||
			!treeviewNodes ||
			treeviewNodes.length === 0
		) {
			return;
		}

		console.log('[uprn/app] Setting initial visibility for treeview nodes');

		const nodesToSetVisible: TreeviewNode[] = [];

		const setVisibility = (nodes: TreeviewNode[]) => {
			nodes.forEach((node) => {
				const config = treeviewConfigStore?.getConfig(node.id);
				if (node) {
					if (config?.isVisibleOnInit) {
						nodesToSetVisible.push(node);
					} else {
						nodeVisibilityController.setVisibilityState(node, false);
					}
				}

				if (node.children) {
					setVisibility(node.children);
				}
			});
		};

		setVisibility(treeviewNodes);
		for (const node of nodesToSetVisible) {
			nodeVisibilityController.setVisibilityState(node, true);
		}

		initializedNodeVisibility = true;
	});

	/** Effect to sync treeview visibility states to the map when it becomes available. */
	$effect(() => {
		if (!mapView || !webMapStore?.isLoaded || !nodeVisibilityController) {
			return;
		}

		console.log('[uprn/app] Syncing treeview visibility states to map');
		const controller = nodeVisibilityController;
		const activeMapView = mapView;
		controller.setVisibilityRenderer(
			new ArcgisNodeVisibilityRenderer(new LayerViewProvider(mapView))
		);
		attachedVisibilityController = controller;
		attachedVisibilityMapView = activeMapView;

		return () => {
			if (
				attachedVisibilityController === controller &&
				attachedVisibilityMapView === activeMapView
			) {
				controller.clearVisibilityRenderer();
				attachedVisibilityController = null;
				attachedVisibilityMapView = null;
			}
		};
	});

	/** Effect to update tab progress based on area and data selection states. */
	$effect(() => {
		const areaLayerSelected = areaSelectionStore.layerId !== null;
		const anyAreaSelected = areaSelectionStore.areaIds.size > 0;
		const anyDataSelected = dataSelectionStore.dataSelections.size > 0;

		setTabProgress(
			TabType.AreaOfInterest,
			areaLayerSelected && anyAreaSelected
				? TabProgress.Completed
				: areaLayerSelected
					? TabProgress.InProgress
					: TabProgress.NotStarted
		);

		setTabProgress(TabType.Data, anyDataSelected ? TabProgress.Completed : TabProgress.NotStarted);

		setTabProgress(
			TabType.Export,
			anyAreaSelected && anyDataSelected
				? TabProgress.Completed
				: anyAreaSelected || anyDataSelected
					? TabProgress.InProgress
					: TabProgress.NotStarted
		);
	});

	/**
	 * Effect to refresh the area selection layer view when the map view or area selection interaction store is initialized.
	 * */
	$effect(() => {
		if (!areaSelectionInteractionStore) {
			return;
		}

		areaSelectionInteractionStore.refreshLayerView();
	});

	/**
	 * Effect to refresh the area selection graphics on the map when the area selection interaction store is initialized.
	 * */
	$effect(() => {
		if (!areaSelectionInteractionStore) {
			return;
		}

		areaSelectionInteractionStore.refreshAreas();
	});

	/**
	 * Effect to apply custom renderers to map layers based on the currently visible variable
	 * nodes in the treeview.
	 */
	$effect(() => {
		if (
			!webMapStore?.isLoaded ||
			!mapView ||
			!customRendererService ||
			!treeviewNodeProvider ||
			!nodeVisibilityController
		) {
			return;
		}

		// Depend on parquet hydration so the custom renderer is (re)applied to the
		// live hydrated layer rather than the placeholder it was created as. Parquet
		// layers start as placeholders and are swapped out asynchronously when first
		// made visible, after the initial style pass has already run.
		const hydrationVersion = webMapStore.hydrationVersion;

		let styledNode: TreeviewNode | undefined;
		for (const [nodeId, isVisible] of nodeVisibilityController.visibilityStates) {
			if (!isVisible) {
				continue;
			}

			const node = treeviewNodeProvider.getTreeviewNode(nodeId);
			if (!node?.capabilities.style) {
				continue;
			}

			styledNode = node;
			break;
		}

		if (!styledNode?.capabilities.style) {
			return;
		}

		const styleRenderer = new ArcgisNodeStyleRenderer(
			new LayerViewProvider(mapView),
			customRendererService
		);
		styleRenderer.applyStyle({
			sourceNode: styledNode,
			style: styledNode.capabilities.style
		});
		console.debug(
			`[uprn/app] Applied custom renderer for ${styledNode.id} (hydration v${hydrationVersion})`
		);
	});

	/**
	 * Starts the application by fetching the app configuration and initializing the map view.
	 */
	function startApp() {
		if (appRunGeneration > 0 || mapView) {
			cleanupRuntimeState({ destroyWebMap: true });
			webMapStoreResetKey += 1;
		}

		appDestroyed = false;
		const runGeneration = ++appRunGeneration;
		initializedNodeVisibility = false;
		selectionPersistence.reset();
		failedWebMapSourceKeys.clear();
		webMapLoadErrorMessage = null;
		mapView = null;

		const async = async () => {
			try {
				const MapView = await arcgisImport<typeof import('@arcgis/core/views/MapView').default>(
					'@arcgis/core/views/MapView.js'
				);
				const nextMapView = new MapView();
				if (appDestroyed || runGeneration !== appRunGeneration) {
					nextMapView.destroy();
					return;
				}

				mapView = nextMapView;
			} catch (error) {
				if (runGeneration === appRunGeneration && !appDestroyed) {
					console.error('[uprn/app] Failed to create MapView', error);
				}
			}
		};
		void async();
	}

	function cleanupRuntimeState(
		options: { destroyWebMap?: boolean; markDestroyed?: boolean } = {}
	): void {
		if (options.markDestroyed) {
			appDestroyed = true;
		}

		appRunGeneration++;
		attachedVisibilityController?.clearVisibilityRenderer();
		attachedVisibilityController = null;
		attachedVisibilityMapView = null;
		nodeVisibilityController?.clearVisibilityRenderer();
		areaSelectionInteractionStore?.cleanup();

		const currentMapView = mapView;
		mapView = null;
		if (currentMapView) {
			currentMapView.destroy();
		}

		if (options.destroyWebMap) {
			void webMapStore?.destroy();
		}

		initializedNodeVisibility = false;
		selectionPersistence.reset();
		failedWebMapSourceKeys.clear();
		webMapLoadErrorMessage = null;
		itemInfoDialogOpen = false;
		itemInfoDialogActiveLayerId = null;
		downloadInfoDialogOpen = false;
		activeDownloadInfo = null;
	}

	/**
	 * Toggles the visibility of the sidebar by updating the sidebarOpen state.
	 */
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	/**
	 * Handles tab value changes and updates the current tab state.
	 * @param value - The new tab value to switch to
	 */
	function onTabValueChange(value: string): void {
		currentTab = value as TabType;
		mountedTabs.add(currentTab);
		console.log(`[uprn/app] Switched to tab: ${value}`);
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
	 * Retrieves the current state of the application tabs, including the active tab and any relevant selections, to be used
	 * for chatbot interactions.
	 * @return An object representing the current state of the application tabs, including the active tab and any relevant selections.
	 */
	async function getTabState(): Promise<AppTabState> {
		const areaPaths: string[] = [];

		const layerId = areaSelectionStore.layerId;
		if (layerId && areaTreeviewStore && areaSelectionInteractionStore) {
			const layerPath = areaTreeviewStore.getNodePathById(layerId);
			if (layerPath) {
				const areaIds = [...areaSelectionStore.areaIds];
				const areaNames = await areaSelectionInteractionStore.getAreaNamesById(areaIds);
				for (const areaName of areaNames) {
					if (areaName) {
						areaPaths.push(`${layerPath}/${areaName}`);
					}
				}
			}
		}

		const dataPaths: string[] = [];
		if (dataTreeviewStore) {
			for (const nodeId of dataSelectionStore.dataSelections.keys()) {
				const path = dataTreeviewStore.getNodePathById(nodeId);
				if (path) {
					dataPaths.push(path);
				}
			}
		}

		console.log('[uprn/app] Retrieved tab state', {
			tab: currentTab,
			selections: {
				area: areaPaths,
				data: dataPaths
			}
		});

		return {
			tab: currentTab,
			selections: {
				area: areaPaths,
				data: dataPaths
			}
		};
	}

	/**
	 * Observes the size of the tab bar and updates the tabBarWidth state accordingly, which is used to adjust
	 * the sidebar minimum size.
	 * @param element - The HTML element of the tab bar to observe for size changes.
	 * @return An object with a destroy method to clean up the observer when the element is removed from the DOM.
	 */
	function observeTabbarSize(element: HTMLElement): { destroy: () => void } {
		const resizeObserver = new ResizeObserver(([entry]) => {
			tabBarWidth = entry.contentRect.width;
		});

		resizeObserver.observe(element);

		return {
			destroy() {
				resizeObserver.disconnect();
			}
		};
	}

	/**
	 * Clears all area selections by resetting the area selection layer, clearing selected areas from the store,
	 * cleaning up interactions, and removing graphics from the map view.
	 */
	function clearAreaSelections() {
		console.log('[uprn/app] Clearing area selections');
		if (areaTreeviewStore && areaSelectionStore.layerId) {
			areaTreeviewStore.setVisibilityState(areaSelectionStore.layerId, false);
		}

		areaSelectionStore.setAreaSelectionLayer(null);
		areaSelectionStore.clearSelectedAreas();
		areaSelectionInteractionStore?.clearSelections();
		mapView?.graphics.removeAll();
	}

	/**
	 * Clears all data selections by clearing selected data from the store and resetting the selected tag IDs.
	 */
	function clearDataSelections() {
		console.log('[uprn/app] Clearing data selections');
		dataSelectionStore.clearSelections();
	}

	/**
	 * Clears selected areas from the map without changing area or data layer visibility.
	 */
	function clearSelectedMapAreas(): void {
		console.log('[uprn/app] Clearing selected map areas');
		areaSelectionInteractionStore?.clearSelections();
	}

	/**
	 * Gets visible data layer node IDs from the data tree/map visibility state.
	 */
	function getVisibleDataLayerNodeIds(): string[] {
		if (!dataTreeviewStore) {
			return [];
		}

		return dataTreeviewStore
			.getVisibleNodes()
			.filter((node) => node.type !== TreeviewNodeType.Folder && isHideableDataLayer(node.id))
			.map((node) => node.id);
	}

	/**
	 * Returns true when a data layer can be hidden by map-level context menu actions.
	 */
	function isHideableDataLayer(nodeId: string): boolean {
		const config = treeviewConfigStore?.getConfig(nodeId);

		if (!config || config.isHidden) {
			return false;
		}

		return config.visibilityGroupId !== persistentUprnVisibilityGroupId;
	}

	/**
	 * Hides data layer nodes that are currently visible on the map.
	 */
	function hideVisibleDataLayers(): void {
		if (!dataTreeviewStore) {
			return;
		}

		for (const nodeId of getVisibleDataLayerNodeIds()) {
			dataTreeviewStore.setVisibilityState(nodeId, false);
		}
	}

	/**
	 * Clears all downloads by clearing the downloads store.
	 */
	function clearDownloads() {
		console.log('[uprn/app] Clearing downloads');
		downloadsStore.clearDownloads();
	}

	/**
	 * Clears the database cache and restarts the application.
	 */
	async function clearCache() {
		console.log('[uprn/app] Clearing cache and restarting app');
		try {
			await clearUprnDatabase();
			startApp();
		} catch (error) {
			console.error('[uprn/app] Failed to clear cache', error);
		}
	}

	/**
	 * Clears all selections and downloads by invoking the respective clear functions for area selections, data
	 * selections, and downloads.
	 */
	function clearAllSelections() {
		console.log('[uprn/app] Clearing all');
		clearAreaSelections();
		clearDataSelections();
		clearDownloads();
		clearCache();
	}

	/**
	 * Event handler for opening the item info dialog, sets the active layer ID and opens the dialog.
	 * @param nodeId - The ID of the node for which to display information in the dialog.
	 */
	function onOpenInfoDialog(nodeId: string): void {
		itemInfoDialogActiveLayerId = nodeId;
		itemInfoDialogOpen = true;
	}

	function onOpenDownloadInfoDialog(download: DownloadEntry): void {
		activeDownloadInfo = download;
		downloadInfoDialogOpen = true;
	}

	setItemInfoContext({
		onOpenInfoDialog
	});
</script>

<AppOverlays
	bind:introductionOpen={introductionDialogOpen}
	{introductionMarkdown}
	bind:itemInfoOpen={itemInfoDialogOpen}
	bind:itemInfoLayerId={itemInfoDialogActiveLayerId}
	bind:downloadInfoOpen={downloadInfoDialogOpen}
	activeDownload={activeDownloadInfo}
	webMapService={webMapStore}
	nodeProvider={treeviewNodeProvider}
	nodeConfigProvider={treeviewConfigStore}
	{areaSelectionInteractionStore}
/>

<Sidebar.Root
	isOpen={sidebarOpen}
	onToggle={toggleSidebar}
	minSize={sidebarMinSize}
	position={Sidebar.SidebarPosition.LEFT}
>
	{#snippet sidebarContent()}
		<div
			class="relative flex h-full w-full min-w-0 flex-col gap-1 overflow-visible bg-slate-200 pt-1 px-1"
		>
			<Card.Root
				class="relative flex flex-1 flex-col overflow-hidden rounded-md gap-0 py-0 shadow-none bg-slate-50"
			>
				<Tabs.Root
					value={currentTab}
					onValueChange={onTabValueChange}
					class="flex min-h-0 flex-1 flex-col gap-0"
				>
					<SidebarLayout.Header>
						<div class="flex w-full justify-center">
							<div class="relative inline-block" use:observeTabbarSize>
								<UprnTabBar triggers={tabBarTriggers} progressByValue={tabProgressByValue}>
									{#snippet actions()}
										<TabHeaderActions
											bind:resetOpen={resetDialogOpen}
											{resetActions}
											sources={appConfig.content.map.sources}
											bind:selectedSourceIndex={selectedMapSourceIndex}
											onOpenIntroduction={() => (introductionDialogOpen = true)}
										/>
									{/snippet}
								</UprnTabBar>
							</div>
						</div>
					</SidebarLayout.Header>

					<SidebarLayout.Content>
						<UprnTabBarContent value={TabType.AreaOfInterest}>
							<AreaSelectionPanel
								mounted={mountedTabs.has(TabType.AreaOfInterest) && loadAreaTreeview}
								treeviewStore={areaTreeviewStore}
								nodeConfigProvider={treeviewConfigStore}
								{areaSelectionStore}
							/>
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Data}>
							<DataSelectionPanel
								mounted={mountedTabs.has(TabType.Data) && loadDataTreeview}
								treeviewStore={dataTreeviewStore}
								nodeConfigProvider={treeviewConfigStore}
								{dataSelectionStore}
							/>
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Export}>
							<ExportReviewPanel
								enabled={loadExportMenu}
								nodeProvider={treeviewNodeProvider}
								nodeConfigProvider={treeviewConfigStore}
								{areaSelectionStore}
								{areaSelectionInteractionStore}
								{dataSelectionStore}
								webMapLoaded={webMapStore?.isLoaded ?? false}
							/>
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Downloads}>
							<ScrollArea class="h-full w-full" type="always" scrollbarYClasses="z-50">
								<DownloadsPanel
									class="px-3"
									health={uprnDownloadHealth}
									portalItemId={downloadPortalItemId}
									endpoints={appConfig.content?.uprnDownload}
									{downloadsStore}
									onOpenInfoDialog={onOpenDownloadInfoDialog}
								/>
							</ScrollArea>
						</UprnTabBarContent>
					</SidebarLayout.Content>

					<SidebarLayout.Footer>
						<div hidden={currentTab !== TabType.Export}>
							{#if areaSelectionInteractionStore && treeviewConfigStore}
								<ExportMenuFooter
									onExportSuccess={() => onTabValueChange(TabType.Downloads)}
									{areaSelectionInteractionStore}
									{areaSelectionStore}
									{dataSelectionStore}
									{downloadsStore}
									nodeConfigProvider={treeviewConfigStore}
									areaSelectionLimits={areaSelectionLimitsMap}
								/>
							{/if}
						</div>
					</SidebarLayout.Footer>
				</Tabs.Root>
			</Card.Root>

			<CollapsibleWindow isOpenedOnInit={true} class="shadow-none">
				<ChatAvailabilityPanel
					health={aiUprnChatbotHealth}
					chatbotConfig={chatbotSettings}
					endpoints={appConfig.content?.aiUprnChatbot}
					{getTabState}
				/>
			</CollapsibleWindow>
		</div>
	{/snippet}

	{#snippet mainContent()}
		<AppMapPane
			webMap={webMapStore?.data ?? null}
			{mapView}
			{areaSelectionInteractionStore}
			{interactableLayers}
			{currentTab}
			errorMessage={webMapLoadErrorMessage}
			onClearSelections={clearSelectedMapAreas}
			onHideVisibleDataLayer={hideVisibleDataLayers}
			{hasVisibleDataLayer}
			class="h-full w-full"
		/>
	{/snippet}
</Sidebar.Root>
