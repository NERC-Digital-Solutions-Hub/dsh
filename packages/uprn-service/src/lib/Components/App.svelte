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
	import * as Card from '$lib/Components/shadcn/card/index.js';
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
	import { useFetchAppConfig } from '$lib/Hooks/UseFetchAppConfig.svelte';
	import { useFetchCustomRenderers } from '$lib/Hooks/UseFetchCustomRenderers.svelte';
	import { useLoadSelectionsFromIndexDb } from '$lib/Hooks/UseLoadSelectionsFromIndexDb.svelte';
	import { useUprnDownloadHealth } from '$lib/Hooks/UseUprnDownloadHealth.svelte';
	import { SelectionState } from '$lib/Models/Treeview/SelectionState';
	import { TreeviewNode } from '$lib/Models/Treeview/TreeviewNode';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import { VariableSubType } from '$lib/Models/Treeview/VariableSubType';
	import type { VariableTreeviewNode } from '$lib/Models/Treeview/VariableTreeviewNode';
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
	import { WebMapStore } from '$lib/Stores/WebMapStore.svelte';
	import type { AppTabState } from '$lib/Types/Chatbot.types';
	import { TreeviewType } from '$lib/Types/Treeview.types';
	import { TabProgress, TabType, type DownloadEntry } from '$lib/Types/Uprn.types';
	import { createTreeviewNodes } from '$lib/Utilities/CreateTreeviewNodes';
	import { Plus } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	const tabBarTriggers = [
		{
			value: TabType.AreaOfInterest,
			label: 'Areas of Interest',
			tooltip: 'Select areas of interest on the map',
			seperatorIcon: Plus
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

	/** Hook for fetching the app configuration. */
	const appConfig = useFetchAppConfig();

	/** State to track whether initial selections have been loaded from the database. */
	let initializedSelectionsFromDb = $state(false);

	/** State to track whether initial node visibility has been set. */
	let initializedNodeVisibility = $state(false);

	/** State to manage the visibility of the sidebar. */
	let sidebarOpen = $state(true);

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

	/** State for tracking the tab bar progress that contains the tabs the user has visited. */
	let tabProgressByValue: Record<string, TabProgress | undefined> = $state({});

	/** State for tracking the tab bar width. */
	let tabBarWidth: number | null = $state(null);

	/** State of the IDs of currently selected tags to filter by. */
	const selectedTagIds: Set<string> = $state(new SvelteSet<string>());

	/** State of the ArcGIS MapView instance. */
	let mapView: __esri.MapView | null = $state(null);

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

	/** Hook to load previous selections from indexedDb based on the portal item ID in the app configuration. */
	const selectionsFromDb = $derived.by(() => {
		if (!appConfig.content?.map.portalItemId) {
			return null;
		}

		const selections = useLoadSelectionsFromIndexDb(appConfig.content.map.portalItemId);
		selections.fetch();
		return selections;
	});

	/** Hook to fetch custom renderers for the map based on the app configuration. */
	const customRenderers = $derived.by(() => {
		if (
			!appConfig.content?.contentConfig?.baseUrl ||
			!appConfig.content.contentConfig.climateJustRenderersPath
		) {
			return null;
		}

		const url: string = new URL(
			appConfig.content.contentConfig.climateJustRenderersPath,
			appConfig.content.contentConfig.baseUrl
		).toString();
		const renderers = useFetchCustomRenderers(url);
		renderers.fetch();
		return renderers;
	});

	/** Derived state to compute the introduction content URL based on the app configuration. */
	const introductionUrl: string | null = $derived.by(() => {
		if (
			!appConfig.content?.contentConfig?.baseUrl ||
			!appConfig.content.contentConfig.introductionPath
		) {
			return null;
		}

		const { baseUrl, introductionPath } = appConfig.content.contentConfig;
		return new URL(introductionPath, baseUrl).toString();
	});

	/** Derived state to compute the chatbot configuration URL based on the app configuration. */
	const chatbotConfigUrl: string | null = $derived.by(() => {
		if (
			!appConfig.content?.contentConfig?.baseUrl ||
			!appConfig.content.contentConfig.chatbotConfigPath
		) {
			return null;
		}

		const { baseUrl, chatbotConfigPath } = appConfig.content.contentConfig;
		return new URL(chatbotConfigPath, baseUrl).toString();
	});

	/** The web map store instance. */
	let webMapStore: WebMapStore | null = $derived.by(() => {
		return appConfig.content
			? new WebMapStore({
					portalUrl: appConfig.content.map.portalUrl,
					itemId: appConfig.content.map.portalItemId || '',
					proxy: appConfig.content.map.proxy
				})
			: null;
	});

	/** The custom renderer service instance. */
	let customRendererService: CustomRendererService | null = $derived.by(() => {
		return customRenderers && customRenderers.content
			? new CustomRendererService(customRenderers.content)
			: null;
	});

	/** The minimum size of the sidebar.  */
	let sidebarMinSize: string | undefined = $derived.by(() => {
		return typeof tabBarWidth === 'number' ? `calc(${tabBarWidth}px + 1rem)` : undefined;
	});

	/** The treeview configuration store. */
	let treeviewConfigStore: TreeviewConfigStore | null = $derived.by(() => {
		return appConfig.content && appConfig.content.map.treeview
			? new TreeviewConfigStore(appConfig.content.map.treeview)
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
					appConfig.content.map.selectableLayers
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
		return mapView && treeviewNodeProvider && treeviewConfigStore
			? new NodeVisibilityController(
					new LayerViewProvider(mapView),
					treeviewNodeProvider,
					treeviewConfigStore,
					treeviewConfigStore
				)
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

	onMount(() => {
		startApp();
	});

	/** Effect to set initial visibility of treeview nodes based on their configurations when they are loaded. */
	$effect(() => {
		if (
			initializedNodeVisibility ||
			!webMapStore?.isLoaded ||
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
		const portalItemId = appConfig.content?.map.portalItemId;
		if (!portalItemId || !initializedSelectionsFromDb) {
			return;
		}

		const snapshot = areaSelectionStore.exportSnapshot();
		if (!snapshot.nodeId) {
			updateSelection(portalItemId, { areas: null });
			return;
		}

		updateSelection(portalItemId, { areas: snapshot });
	});

	/**
	 * Effect to track changes in data selection and update the selection tracking in indexedDb.
	 * It listens for changes in the data selection snapshot and updates the stored selection for the current portal item.
	 */

	$effect(() => {
		const portalItemId = appConfig.content?.map.portalItemId;
		if (!portalItemId || !initializedSelectionsFromDb) {
			return;
		}

		const selections = [...dataSelectionStore.dataSelections.values()];
		const snapshots = $state.snapshot(selections) as DataSelectionSnapshot[];
		updateSelection(portalItemId, {
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

		let variableNode: TreeviewNode | undefined;
		for (const [nodeId, isVisible] of nodeVisibilityController.visibilityStates) {
			if (!isVisible) {
				continue;
			}

			const node = treeviewNodeProvider.getTreeviewNode(nodeId);
			if (!node || !isVariableNode(node)) {
				continue;
			}

			if (node.variableSubType === VariableSubType.Field) {
				variableNode = node;
				break;
			}
		}

		if (!variableNode || !isVariableNode(variableNode)) {
			return;
		}

		const layer: __esri.Layer | nullish = mapView.map?.findLayerById(variableNode.layerId);
		if (!layer) {
			console.warn(
				`[uprn/app] Could not find layer for variable node ${variableNode.id} with layer ID ${variableNode.layerId}`
			);
			return;
		}

		customRendererService.applyCustomRenderer(
			layer as __esri.FeatureLayer,
			variableNode.variableId
		);
		console.log(
			`[uprn/app] Applied custom renderer for variable node ${variableNode.id} on layer ${layer.id}`
		);
	});

	/**
	 * Starts the application by fetching the app configuration and initializing the map view.
	 */
	function startApp() {
		initializedNodeVisibility = false;
		initializedSelectionsFromDb = false;
		mapView = null;

		appConfig.fetch();
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
	function getTabState(): AppTabState {
		const areaIds: string[] = [...areaSelectionStore.areaIds].map((id) => String(id));
		const dataSelectionIds: string[] = [...dataSelectionStore.dataSelections.keys()];

		let selections: string[] = [];
		switch (currentTab) {
			case TabType.AreaOfInterest:
				selections = areaIds;
				break;
			case TabType.Data:
				selections = dataSelectionIds;
				break;
			case TabType.Export:
				selections = [...areaIds, ...dataSelectionIds];
				break;
			case TabType.Downloads:
				selections = [];
				break;
		}

		return {
			tab: currentTab,
			selections: selections
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
	 * Checks if a given node is a VariableTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a VariableTreeviewNode, false otherwise.
	 */
	function isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
		return node.type === TreeviewNodeType.Variable;
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

<IntroductionDialog contentUrl={introductionUrl} />

<Toaster />
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
				<SidebarLayout.Header>
					<div class="tabs-center">
						<div class="tabbar-anchor" use:observeTabbarSize>
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

				<div hidden={currentTab !== TabType.AreaOfInterest}>
					<p class="w-full text-xs text-muted-foreground text-right px-2 pr-4 pb-1">
						{areaSelectionStore.areaIds.size} area(s) selected
					</p>
				</div>

				<div hidden={currentTab !== TabType.Data}>
					<p class="w-full text-xs text-muted-foreground text-right px-2 pr-4 pb-1">
						{dataSelectionStore.dataSelections.size} dataset(s) selected
					</p>
				</div>

				<SidebarLayout.Content>
					<div hidden={currentTab !== TabType.AreaOfInterest}>
						<UprnTabBarContent>
							{#if loadAreaTreeview}
								<AreaSelectionTreeview
									treeviewStore={areaTreeviewStore!}
									nodeConfigProvider={treeviewConfigStore!}
									areaSelectionController={areaSelectionStore}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== TabType.Data}>
						<UprnTabBarContent>
							{#if loadDataTreeview}
								<DataSelectionTreeview
									treeviewStore={dataTreeviewStore!}
									nodeConfigProvider={treeviewConfigStore!}
									nodeTagProvider={treeviewConfigStore!}
									tagDefinitionProvider={tagDefinitionProvider!}
									{selectedTagIds}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== TabType.Export}>
						<UprnTabBarContent>
							{#if loadExportMenu}
								<ExportMenu
									nodeProvider={treeviewNodeProvider!}
									nodeConfigProvider={treeviewConfigStore!}
									areaSelectionInteractionStore={areaSelectionInteractionStore!}
									{dataSelectionStore}
								/>
							{/if}
						</UprnTabBarContent>
					</div>

					<div hidden={currentTab !== TabType.Downloads}>
						<UprnTabBarContent>
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
						</UprnTabBarContent>
					</div>
				</SidebarLayout.Content>

				<SidebarLayout.Footer>
					<div hidden={currentTab !== 'export'}>
						{#if areaSelectionInteractionStore && treeviewConfigStore}
							<ExportMenuFooter
								onExportSuccess={() => onTabValueChange('downloads')}
								{areaSelectionInteractionStore}
								{dataSelectionStore}
								{downloadsStore}
								nodeConfigProvider={treeviewConfigStore}
							/>
						{/if}
					</div>
				</SidebarLayout.Footer>
			</Card.Root>

			<CollapsibleWindow isOpenedOnInit={true} class="mt-0 shadow-none">
				{#if !aiUprnChatbotHealth || aiUprnChatbotHealth.isLoading}
					<div class="flex h-full w-full items-center justify-center">
						<Spinner class="w-10 h-10" />
					</div>
				{:else if !!aiUprnChatbotHealth && (!aiUprnChatbotHealth.isAccessible || !!aiUprnChatbotHealth.error)}
					<p class="p-4 text-center text-sm text-gray-500">
						AI UPRN Chatbot service is not available.
					</p>
				{:else if !!aiUprnChatbotHealth && aiUprnChatbotHealth.isAccessible && chatbotConfigUrl && appConfig.content?.aiUprnChatbot}
					{@const chatEndpoint = `${appConfig.content.aiUprnChatbot.baseUrl}${appConfig.content.aiUprnChatbot.chatRoute}`}
					{@const feedbackEndpoint = `${appConfig.content.aiUprnChatbot.baseUrl}${appConfig.content.aiUprnChatbot.feedbackRoute}`}
					<UprnChat configUrl={chatbotConfigUrl} {chatEndpoint} {feedbackEndpoint} {getTabState} />
				{/if}
			</CollapsibleWindow>
		</div>
	{/snippet}

	{#snippet mainContent()}
		{#if loadMapView}
			<UprnMapView
				webMap={webMapStore?.data!}
				mapView={mapView!}
				areaSelectionInteractionStore={areaSelectionInteractionStore!}
				interactableLayers={interactableLayers!}
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
