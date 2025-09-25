<script lang="ts">
	import SvelteMapView from '$lib/components/common/uprn-map-view/uprn-map-view.svelte';
	import DropDownPanel from '$lib/components/common/drop-down-panel.svelte';
	import ArcgisTreeView from '$lib/components/common/data-selection-tree-view/tree-view.svelte';
	import ArcgisSelectionLayerMenu from '$lib/components/common/arcgis-selection-layer-menu/menu.svelte';
	import {
		getAppConfigAsync,
		type AppConfig,
		type TreeviewConfig
	} from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { WebMapStore } from '$lib/stores/web-map-store.svelte';

	const webMapStore = new WebMapStore();
	let treeviewSelectionAreasConfig: TreeviewConfig[] | null = $state<TreeviewConfig[] | null>(null);
	let treeviewDataConfig: TreeviewConfig[] | null = $state<TreeviewConfig[] | null>(null);

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();
		const portalUrl = appConfig.portalUrl;
		const portalId = appConfig.portalItemId;
		const proxy = appConfig.proxy;
		treeviewSelectionAreasConfig = appConfig.treeviewSelectionAreasConfig;
		treeviewDataConfig = appConfig.treeviewDataConfig || null;

		console.log('Selection Layers:', $state.snapshot(treeviewSelectionAreasConfig));

		await webMapStore.initializeAsync({
			portalUrl: portalUrl,
			itemId: portalId || '',
			proxy: proxy
		});

		console.log('WebMap loaded', $state.snapshot(webMapStore.data));
	});
</script>

{#snippet panelContent()}
	<DropDownPanel header="Treeview" className="w-120">
		<ArcgisTreeView webMap={webMapStore.data} treeviewConfig={treeviewDataConfig} />
	</DropDownPanel>
{/snippet}

{#snippet menuContent()}
	<ArcgisSelectionLayerMenu
		webMap={webMapStore.data}
		treeviewConfig={treeviewSelectionAreasConfig}
	/>
{/snippet}

<div class="map-section">
	{#if webMapStore.data}
		<SvelteMapView
			webMap={webMapStore.data}
			panelPosition="top-left"
			menuPosition="top-right"
			panel={panelContent}
			menu={menuContent}
		/>
	{:else}
		<p>Loading map...</p>
	{/if}
</div>

<style>
	.map-section {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
	}
</style>
