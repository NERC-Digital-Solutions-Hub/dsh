<script lang="ts">
	import AreaSelectionHoverCard from '$lib/Components/AreaSelectionHoverCard/AreaSelectionHoverCard.svelte';
	import AreaSelectionToast from '$lib/Components/AreaSelectionToast/AreaSelectionToast.svelte';
	import UprnChat from '$lib/Components/Chat/Chat.svelte';
	import CollapsibleWindow from '$lib/Components/CollapsibleWindow/CollapsibleWindow.svelte';
	import DownloadsMenu from '$lib/Components/DownloadsMenu/DownloadsMenu.svelte';
	import DownloadInfoDialog from '$lib/Components/DownloadsMenu/DownloadInfoDialog.svelte';
	import ExportMenuFooter from '$lib/Components/ExportMenu/ExportMenuFooter.svelte';
	import ExportMenu from '$lib/Components/ExportMenu/ExportMenu.svelte';
	import IntroductionDialog from '$lib/Components/IntroductionDialog/IntroductionDialog.svelte';
	import ItemInfoDialog from '$lib/Components/ItemInfoDialog/ItemInfoDialog.svelte';
	import type { ResetAction } from '$lib/Components/ResetDialog/ResetDialog.svelte';
	import ResetDialog from '$lib/Components/ResetDialog/ResetDialog.svelte';
	import DebugDialog from '$lib/Components/DebugDialog/DebugDialog.svelte';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import * as Tabs from '$lib/Components/shadcn/tabs/index.js';
	import { Toaster } from '$lib/Components/shadcn/sonner';
	import Spinner from '$lib/Components/shadcn/spinner/spinner.svelte';
	import * as SidebarLayout from '$lib/Components/SidebarLayout/index.js';
	import * as Sidebar from '$lib/Components/Sidebar/index.js';
	import AreaSelectionTreeview from '$lib/Components/Treeview/Area/Treeview.svelte';
	import DataSelectionTreeview from '$lib/Components/Treeview/Data/Treeview.svelte';
	import UprnMapView from '$lib/Components/UprnMapView/UprnMapView.svelte';
	import UprnTabBarContent from '$lib/Components/UprnTabBar/UrpnTabBarContent.svelte';
	import UprnTabBar from '$lib/Components/UprnTabBar/UprnTabBar.svelte';
	import { clearDatabase, updateSelection } from '$lib/db';
	import { setItemInfoDialogEvents } from '$lib/Events/ItemInfoDialogEvents';
	import { useAiChatbotHealth } from '$lib/Hooks/UseAiChatbotHealth.svelte';
	import { useLoadSelectionsFromIndexDb } from '$lib/Hooks/UseLoadSelectionsFromIndexDb.svelte';
	import { useUprnDownloadHealth } from '$lib/Hooks/UseUprnDownloadHealth.svelte';
	import { SelectionState } from '$lib/Models/Treeview/SelectionState';
	import { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import { ArcgisNodeStyleRenderer } from '$lib/Services/ArcgisNodeStyleRenderer';
	import { ArcgisNodeVisibilityRenderer } from '$lib/Services/ArcgisNodeVisibilityRenderer';
	import { CustomRendererService } from '$lib/Services/CustomRendererService';
	import type { INodeProvider } from '$lib/Services/INodeProvider';
	import { LayerViewProvider } from '$lib/Services/LayerViewProvider';
	import { NodeProvider } from '$lib/Services/NodeProvider';
	import { NodeSelectionController } from '$lib/Services/NodeSelectionController';
	import { NodeVisibilityController } from '$lib/Services/NodeVisibilityController.svelte';
	import { TabStateService } from '$lib/Services/TabStateService';
	import { TagDefinitionProvider } from '$lib/Services/TagDefinitionProvider';
	import { AreaSelectionInteractionStore } from '$lib/Stores/AreaSelectionInteractionStore.svelte';
	import { AreaSelectionStore } from '$lib/Stores/AreaSelectionStore.svelte';
	import {
		DataSelectionStore,
		type DataSelectionSnapshot
	} from '$lib/Stores/DataSelectionStore.svelte';
	import DownloadsStore from '$lib/Stores/DownloadsStore.svelte';
	import { TreeviewConfigStore } from '$lib/Stores/TreeviewConfigStore';
	import { TreeviewStore } from '$lib/Stores/TreeviewStore.svelte';
	import { getWebMapSourcePersistenceKey, WebMapStore } from '$lib/Stores/WebMapStore.svelte';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import { TreeviewType } from '$lib/Types/Treeview.types';
	import { TabProgress, TabType, type DownloadEntry } from '$lib/Types/Uprn.types';
	import { createTreeviewNodes } from '$lib/Utilities/CreateTreeviewNodes';
	import { installBrowserPolyfills } from '$lib/Utilities/browser-polyfills';
	import { InfoIcon, Plus } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { useUprnDownloadSelectionAreaLimits } from '$lib/Hooks/UseUprnDownloadSelectionAreaLimits.svelte';
	import Button from '$lib/Components/shadcn/button/button.svelte';
	import type { AppsUprnConfig, ChatbotConfig } from '$lib/Types/Configuration.types';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	installBrowserPolyfills();

	type Props = {
		config: AppsUprnConfig;
	};

	let { config }: Props = $props();

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

	const tabStateService = new TabStateService('areas-of-interest');
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

	/** State to track whether initial selections have been loaded from the database. */
	let initializedSelectionsFromDb = $state(false);

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

	/** State of the IDs of currently selected tags to filter by. */
	const selectedTagIds: Set<string> = new SvelteSet<string>();

	/** State of the ArcGIS MapView instance. */
	let mapView: __esri.MapView | null = $state(null);

	/** State to track whether the treeview visibility states have been synced to the map. */
	let mapSyncedWithNodeVisibility = $state(false);

	/** Hook for the AI UPRN chatbot health check. */
	const aiUprnChatbotHealth = $derived.by(() => {
		if (!appConfig.content?.aiUprnChatbot) {
			return null;
		}

		const { baseUrl, healthRoute } = appConfig.content.aiUprnChatbot;
		const url = `${baseUrl}${healthRoute}`;
		const health = useAiChatbotHealth(url);
		health.fetch();
		return health;
	});

	/** Hook for the UPRN download health check. */
	const uprnDownloadHealth = $derived.by(() => {
		if (!appConfig.content?.uprnDownload) {
			return null;
		}

		const { baseUrl, healthRoute } = appConfig.content.uprnDownload;
		const url = `${baseUrl}${healthRoute}`;
		const health = useUprnDownloadHealth(url);
		health.fetch();
		return health;
	});

	/** Index of the active web map source (resets to the default on each load). */
	let selectedMapSourceIndex = $state(0);

	/** The currently selected web map source, falling back to the default. */
	const selectedMapSource = $derived.by(() => {
		const sources = appConfig.content?.map.sources;
		if (!sources?.length) {
			return null;
		}

		return sources[selectedMapSourceIndex] ?? sources[0];
	});

	/** Stable key used to persist selections for portal, static, and API-backed webmaps. */
	const webMapPersistenceKey: string | null = $derived.by(() => {
		if (!selectedMapSource) {
			return null;
		}

		return getWebMapSourcePersistenceKey(selectedMapSource);
	});

	/** Hook to load previous selections from indexedDb for the configured webmap. */
	const selectionsFromDb = $derived.by(() => {
		if (!webMapPersistenceKey) {
			return null;
		}

		const selections = useLoadSelectionsFromIndexDb(webMapPersistenceKey);
		selections.fetch();
		return selections;
	});

	/** Hook to fetch area selection limits for the UPRN download service. */
	const areaSelectionLimits = $derived.by(() => {
		if (!appConfig.content?.uprnDownload || !appConfig.content.map.selectableLayers) {
			return null;
		}

		const url: string = `${appConfig.content.uprnDownload.baseUrl}${appConfig.content.uprnDownload.getAreaSelectionLimitsRoute}`;

		const layerIds = appConfig.content.map.selectableLayers
			? appConfig.content.map.selectableLayers.map((layer) => layer.id)
			: [];

		const limits = useUprnDownloadSelectionAreaLimits(url, layerIds);
		limits.fetch();
		return limits;
	});

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

	/** The web map store instance. */
	let webMapStore: WebMapStore | null = $derived.by(() => {
		return selectedMapSource
			? new WebMapStore({
					source: selectedMapSource,
					proxy: undefined
				})
			: null;
	});

	/** The custom renderer service instance. */
	let customRendererService: CustomRendererService | null = $derived.by(() => {
		return appConfig.content?.content.customRenderers
			? new CustomRendererService(appConfig.content.content.customRenderers)
			: null;
	});

	/** The minimum size of the sidebar.  */
	let sidebarMinSize: string | undefined = $derived.by(() => {
		return typeof tabBarWidth === 'number' ? `calc(${tabBarWidth}px + 1rem)` : undefined;
	});

	/** The treeview configuration store. */
	let treeviewConfigStore: TreeviewConfigStore | null = $derived.by(() => {
		return appConfig.content && appConfig.content.treeviewConfig
			? new TreeviewConfigStore(appConfig.content.treeviewConfig)
			: null;
	});

	/** Controller for managing data node selections. */
	let dataNodeSelectionController: NodeSelectionController | null = $derived.by(() => {
		return treeviewConfigStore
			? new NodeSelectionController(dataSelectionStore, treeviewConfigStore)
			: null;
	});

	/** Provider for tag definitions. */
	let tagDefinitionProvider: TagDefinitionProvider | null = $derived.by(() => {
		return appConfig.content && appConfig.content.map.tagDefinitions
			? new TagDefinitionProvider(appConfig.content.map.tagDefinitions)
			: null;
	});

	/** Store for managing area selection interactions on the map. */
	let areaSelectionInteractionStore: AreaSelectionInteractionStore | null = $derived.by(() => {
		return mapView && appConfig.content?.map.selectableLayers
			? new AreaSelectionInteractionStore(
					areaSelectionStore,
					new LayerViewProvider(mapView),
					appConfig.content.map.selectableLayers,
					webMapStore
				)
			: null;
	});

	/** A set of layer IDs that are interactable based on the app configuration. */
	let interactableLayers: SvelteSet<string> | null = $derived.by(() => {
		return appConfig.content && appConfig.content.map.selectableLayers
			? new SvelteSet(appConfig.content.map.selectableLayers.map((layer) => layer.id))
			: null;
	});

	let treeviewNodes: TreeviewNode[] | null = $derived.by(() => {
		return treeviewConfigStore ? createTreeviewNodes(treeviewConfigStore.configs) : null;
	});

	/** The node provider for the area treeview. */
	let treeviewNodeProvider: INodeProvider | null = $derived.by(() => {
		return treeviewNodes ? new NodeProvider(treeviewNodes) : null;
	});

	/** The area treeview nodes. */
	let areaTreeviewNodes: TreeviewNode[] | null = $derived.by(() => {
		return treeviewNodes && treeviewNodes.length > 0
			? filterTreeviewNodesByType(treeviewNodes, TreeviewType.Area)
			: null;
	});

	/** The node provider for the area treeview. */
	let areaTreeviewNodeProvider: INodeProvider | null = $derived.by(() => {
		return areaTreeviewNodes ? new NodeProvider(areaTreeviewNodes) : null;
	});

	/** The data treeview nodes. */
	let dataTreeviewNodes: TreeviewNode[] | null = $derived.by(() => {
		return treeviewNodes && treeviewNodes.length > 0
			? filterTreeviewNodesByType(treeviewNodes, TreeviewType.Data)
			: null;
	});

	/** The node provider for the data treeview. */
	let dataTreeviewNodeProvider: INodeProvider | null = $derived.by(() => {
		return dataTreeviewNodes ? new NodeProvider(dataTreeviewNodes) : null;
	});

	/** Controller for managing node visibility. */
	let nodeVisibilityController: NodeVisibilityController | null = $derived.by(() => {
		return treeviewNodeProvider && treeviewConfigStore
			? new NodeVisibilityController(treeviewNodeProvider, treeviewConfigStore, treeviewConfigStore)
			: null;
	});

	/** The area treeview store instance. */
	let areaTreeviewStore: TreeviewStore | null = $derived.by(() => {
		return areaTreeviewNodeProvider &&
			treeviewConfigStore &&
			dataNodeSelectionController &&
			nodeVisibilityController
			? new TreeviewStore(
					TreeviewType.Area,
					areaTreeviewNodeProvider,
					treeviewConfigStore,
					treeviewConfigStore,
					dataNodeSelectionController,
					nodeVisibilityController
				)
			: null;
	});

	/** The data treeview store instance. */
	let dataTreeviewStore: TreeviewStore | null = $derived.by(() => {
		return dataTreeviewNodeProvider &&
			treeviewConfigStore &&
			dataNodeSelectionController &&
			nodeVisibilityController
			? new TreeviewStore(
					TreeviewType.Data,
					dataTreeviewNodeProvider,
					treeviewConfigStore,
					treeviewConfigStore,
					dataNodeSelectionController,
					nodeVisibilityController
				)
			: null;
	});

	/** Determines whether the map view can be rendered based on the availability of required dependencies. */
	let loadMapView: boolean = $derived(
		!!(webMapStore && webMapStore.data && areaSelectionInteractionStore && interactableLayers)
	);

	/** Determines whether the area treeview can be rendered based on the availability of required dependencies. */
	let loadAreaTreeview: boolean = $derived(
		!!(areaTreeviewNodes && areaTreeviewStore && treeviewConfigStore)
	);

	/** Determines whether the data treeview can be rendered based on the availability of required dependencies. */
	let loadDataTreeview: boolean = $derived(
		!!(dataTreeviewNodes && dataTreeviewStore && treeviewConfigStore && tagDefinitionProvider)
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

	$effect(() => {
		if (!settings?.enableIntroductionPopup) {
			return;
		}

		console.log('[uprn/app] Introduction popup enabled, showing dialog');
		introductionDialogOpen = true;
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
		if (
			mapSyncedWithNodeVisibility ||
			!mapView ||
			!webMapStore?.isLoaded ||
			!nodeVisibilityController
		) {
			return;
		}

		console.log('[uprn/app] Syncing treeview visibility states to map');
		nodeVisibilityController.setVisibilityRenderer(
			new ArcgisNodeVisibilityRenderer(new LayerViewProvider(mapView))
		);
		mapSyncedWithNodeVisibility = true;
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
	 * Effect to load previous selections from indexedDb and populate the area and data
	 * selection stores accordingly.
	 */
	$effect(() => {
		if (
			initializedSelectionsFromDb ||
			!initializedNodeVisibility ||
			!selectionsFromDb ||
			selectionsFromDb.isLoading ||
			!selectionsFromDb.content ||
			!treeviewNodeProvider ||
			!nodeVisibilityController ||
			!dataNodeSelectionController
		) {
			return;
		}

		const selections = selectionsFromDb.content;
		console.log('[uprn/app] Loaded selections from IndexedDb', selections);

		if (selections.areas) {
			areaSelectionStore.setAreaSelectionLayer(selections.areas.nodeId);
			areaSelectionStore.addSelectedAreas(Array.from(selections.areas.areaIds));

			if (selections.areas.nodeId) {
				const node = treeviewNodeProvider.getTreeviewNode(selections.areas.nodeId);
				if (node) {
					nodeVisibilityController.setVisibilityState(node, true);
				}
			}
		}

		selections.data.forEach((dataSelection) => {
			dataSelectionStore.addSelection(dataSelection);
			if (dataSelection.selectedFieldIds.size === 0) {
				const node = treeviewNodeProvider.getTreeviewNode(dataSelection.nodeId);
				if (node) {
					dataNodeSelectionController.setSelectionState(node, SelectionState.Active);
				}
			}

			dataSelection.selectedFieldIds.forEach((fieldId) => {
				const nodeId = `${dataSelection.nodeId}-${fieldId}`;
				const node = treeviewNodeProvider.getTreeviewNode(nodeId);
				if (node) {
					dataNodeSelectionController.setSelectionState(node, SelectionState.Active);
				}
			});
		});

		initializedSelectionsFromDb = true;
	});

	/**
	 * Effect to track changes in area selection and update the selection tracking in indexedDb.
	 * It listens for changes in the area selection snapshot and updates the stored selection for the current portal item.
	 */
	$effect(() => {
		if (!webMapPersistenceKey || !initializedSelectionsFromDb) {
			return;
		}

		const snapshot = areaSelectionStore.exportSnapshot();
		if (!snapshot.nodeId) {
			updateSelection(webMapPersistenceKey, { areas: null });
			return;
		}

		updateSelection(webMapPersistenceKey, { areas: snapshot });
	});

	/**
	 * Effect to track changes in data selection and update the selection tracking in indexedDb.
	 * It listens for changes in the data selection snapshot and updates the stored selection for the current portal item.
	 */

	$effect(() => {
		if (!webMapPersistenceKey || !initializedSelectionsFromDb) {
			return;
		}

		const selections = [...dataSelectionStore.dataSelections.values()];
		const snapshots = $state.snapshot(selections) as DataSelectionSnapshot[];
		updateSelection(webMapPersistenceKey, {
			data: snapshots
		});
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
	});

	/**
	 * Starts the application by fetching the app configuration and initializing the map view.
	 */
	function startApp() {
		initializedNodeVisibility = false;
		initializedSelectionsFromDb = false;
		mapSyncedWithNodeVisibility = false;
		mapView = null;

		const async = async () => {
			const { default: MapView } = await import('@arcgis/core/views/MapView');
			mapView = new MapView();
		};
		async();
	}

	/**
	 * Toggles the visibility of the sidebar by updating the sidebarOpen state.
	 */
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	/**
	 * Recursively filters treeview nodes based on the specified treeview type and visibility settings.
	 * @param nodes - The array of TreeviewNode instances to filter.
	 * @param type - The TreeviewType to filter nodes by.
	 * @return An array of TreeviewNode instances that match the specified type and are not hidden, with their
	 * children also filtered accordingly.
	 */
	function filterTreeviewNodesByType(nodes: TreeviewNode[], type: TreeviewType): TreeviewNode[] {
		return nodes
			.filter((node) => {
				const config = treeviewConfigStore?.getConfig(node.id);
				return config?.treeviewType === type && !config.isHidden;
			})
			.map((node) => {
				if (node.children) {
					return {
						...node,
						children: filterTreeviewNodesByType(node.children, type)
					};
				}
				return node;
			});
	}

	/**
	 * Handles tab value changes and updates the current tab state.
	 * @param value - The new tab value to switch to
	 */
	function onTabValueChange(value: string): void {
		currentTab = value as TabType;
		mountedTabs.add(currentTab);
		tabStateService.setCurrentTab(value);
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
		selectedTagIds.clear();
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
			await clearDatabase();
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

	setItemInfoDialogEvents({
		onOpenInfoDialog
	});
</script>

<IntroductionDialog bind:isOpen={introductionDialogOpen} content={introductionMarkdown} />

<Toaster visibleToasts={1} position="bottom-right" />
{#if webMapStore?.isLoaded && treeviewConfigStore}
	<ItemInfoDialog
		bind:isOpen={itemInfoDialogOpen}
		bind:activeLayerId={itemInfoDialogActiveLayerId}
		webmapService={webMapStore}
		nodeConfigProvider={treeviewConfigStore}
	/>
	<DownloadInfoDialog
		bind:isOpen={downloadInfoDialogOpen}
		download={activeDownloadInfo}
		nodeProvider={treeviewNodeProvider!}
		nodeConfigProvider={treeviewConfigStore}
	/>
{/if}
{#if areaSelectionInteractionStore}
	<AreaSelectionHoverCard {areaSelectionInteractionStore} />
	<AreaSelectionToast {areaSelectionInteractionStore} />
{/if}

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
						<div class="tabs-center">
							<div class="tabbar-anchor" use:observeTabbarSize>
								<UprnTabBar triggers={tabBarTriggers} progressByValue={tabProgressByValue}>
									{#snippet actions()}
										<ResetDialog
											bind:open={resetDialogOpen}
											actions={resetActions}
											buttonClass="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
										>
											{#snippet children()}
												{#if appConfig.content}
													<DebugDialog
														class="w-5 h-5"
														sources={appConfig.content.map.sources}
														bind:selectedIndex={selectedMapSourceIndex}
													/>
												{/if}
											{/snippet}
										</ResetDialog>
										<Tooltip.Provider disableHoverableContent>
											<Tooltip.Root>
												<Tooltip.Trigger>
													{#snippet child({ props })}
														<Button
															{...props}
															class="shadow-none p-0 w-8 h-8 hover:bg-transparent focus:outline-none focus:ring-0"
															variant="outline"
															aria-label="Information"
															onclick={() => (introductionDialogOpen = true)}
														>
															<InfoIcon class="w-5 h-5" aria-hidden="true" />
														</Button>
													{/snippet}
												</Tooltip.Trigger>
												<Tooltip.Content side="bottom">
													<p>Information</p>
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/snippet}
								</UprnTabBar>
							</div>
						</div>
					</SidebarLayout.Header>

					<SidebarLayout.Content>
						<UprnTabBarContent value={TabType.AreaOfInterest}>
							{#if mountedTabs.has(TabType.AreaOfInterest) && loadAreaTreeview}
								<AreaSelectionTreeview
									treeviewStore={areaTreeviewStore!}
									nodeConfigProvider={treeviewConfigStore!}
									areaSelectionController={areaSelectionStore}
									selectionCount={areaSelectionStore.areaIds.size}
								/>
							{/if}
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Data}>
							{#if mountedTabs.has(TabType.Data) && loadDataTreeview}
								<DataSelectionTreeview
									treeviewStore={dataTreeviewStore!}
									nodeConfigProvider={treeviewConfigStore!}
									nodeTagProvider={treeviewConfigStore!}
									tagDefinitionProvider={tagDefinitionProvider!}
									{selectedTagIds}
									selectionCount={dataSelectionStore.dataSelections.size}
								/>
							{/if}
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Export}>
							<ScrollArea class="h-full w-full" type="always" scrollbarYClasses="z-50">
								{#if loadExportMenu}
									<div class="min-w-0 px-3">
										<ExportMenu
											nodeProvider={treeviewNodeProvider!}
											nodeConfigProvider={treeviewConfigStore!}
											{areaSelectionStore}
											areaSelectionInteractionStore={areaSelectionInteractionStore!}
											{dataSelectionStore}
											webMapLoaded={webMapStore?.isLoaded ?? false}
										/>
									</div>
								{/if}
							</ScrollArea>
						</UprnTabBarContent>

						<UprnTabBarContent value={TabType.Downloads}>
							<ScrollArea class="h-full w-full" type="always" scrollbarYClasses="z-50">
								<div class="min-h-0 px-3">
									{#if !uprnDownloadHealth || uprnDownloadHealth.isLoading}
										<div class="flex h-full w-full items-center justify-center">
											<Spinner class="w-10 h-10" />
										</div>
									{:else if !!uprnDownloadHealth && (!uprnDownloadHealth.isAccessible || !!uprnDownloadHealth.error)}
										<p class="p-4 text-center text-sm text-gray-500">
											Download service is not available.
										</p>
									{:else if !!uprnDownloadHealth && uprnDownloadHealth.isAccessible && appConfig.content?.uprnDownload}
										{@const requestJobUrl = `${appConfig.content.uprnDownload.baseUrl}${appConfig.content.uprnDownload.requestJobRoute}`}
										{@const requestJobStatusUrl = `${appConfig.content.uprnDownload.baseUrl}${appConfig.content.uprnDownload.requestJobStatusesRoute}`}
										{@const downloadBaseUrl = `${appConfig.content.uprnDownload.baseUrl}${appConfig.content.uprnDownload.fetchDownloadRoute}`}
										<DownloadsMenu
											{downloadsStore}
											{requestJobUrl}
											jobStatusesUrl={requestJobStatusUrl}
											{downloadBaseUrl}
											onOpenInfoDialog={onOpenDownloadInfoDialog}
										/>
									{/if}
								</div>
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
				{#if !aiUprnChatbotHealth || aiUprnChatbotHealth.isLoading}
					<div class="flex h-full w-full items-center justify-center">
						<Spinner class="w-10 h-10" />
					</div>
				{:else if !!aiUprnChatbotHealth && (!aiUprnChatbotHealth.isAccessible || !!aiUprnChatbotHealth.error)}
					<p class="p-4 text-center text-sm text-gray-500">
						AI UPRN Chatbot service is not available.
					</p>
				{:else if !!aiUprnChatbotHealth && aiUprnChatbotHealth.isAccessible && chatbotSettings && appConfig.content?.aiUprnChatbot}
					{@const chatEndpoint = `${appConfig.content.aiUprnChatbot.baseUrl}${appConfig.content.aiUprnChatbot.chatRoute}`}
					{@const feedbackEndpoint = `${appConfig.content.aiUprnChatbot.baseUrl}${appConfig.content.aiUprnChatbot.feedbackRoute}`}
					<UprnChat
						chatbotConfig={chatbotSettings}
						{chatEndpoint}
						{feedbackEndpoint}
						{getTabState}
					/>
				{/if}
			</CollapsibleWindow>
		</div>
	{/snippet}

	{#snippet mainContent()}
		{#if loadMapView}
			<UprnMapView
				webMap={webMapStore!.data!}
				mapView={mapView!}
				areaSelectionInteractionStore={areaSelectionInteractionStore!}
				interactableLayers={interactableLayers!}
				{currentTab}
				onClearSelections={clearSelectedMapAreas}
				onHideVisibleDataLayer={hideVisibleDataLayers}
				{hasVisibleDataLayer}
				class="h-full min-h-0 w-full flex-1"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<Spinner class="w-10 h-10" />
			</div>
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

	.tabbar-anchor {
		position: relative;
		display: inline-block;
	}
</style>
