<script lang="ts">
	import SvelteMapView from '$lib/components/common/map-view.svelte';
	import DropDownPanel from '$lib/components/common/drop-down-panel.svelte';
	import ArcgisTreeView from '$lib/components/common/arcgis-tree-view/tree-view.svelte';
	import ArcgisSelectionLayerMenu from '$lib/components/common/arcgis-selection-layer-menu/menu.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { webmapStore, type Proxy } from '$lib/stores/webmap-store.svelte';

	let webMap: __esri.WebMap | null = $state<__esri.WebMap | null>(null);
	let selectionLayers: string[] = $state<string[]>([]);
	let treeviewOrder: { name: string }[] | null = $state<{ name: string }[] | null>(null);

	onMount(async () => {
		let appConfig = await fetch(`${base}/app-config.json`).then((res) => res.json()); // TODO: use a store.
		const portalUrl = appConfig.portalUrl;
		const portalId = appConfig.portalItemId;
		const proxy = appConfig.proxy;
		selectionLayers = appConfig.selectionLayers;
		treeviewOrder = appConfig.treeviewOrder || null;

		console.log('Selection Layers:', $state.snapshot(selectionLayers));

		await webmapStore.initializeAsync({
			portalUrl: portalUrl,
			itemId: portalId || '',
			proxy: proxy
		});

		webMap = webmapStore.getWebmap();
		console.log('WebMap loaded', $state.snapshot(webMap));
	});
</script>

{#snippet panelContent()}
	<DropDownPanel header="Treeview" className="w-120">
		<ArcgisTreeView {webMap} {treeviewOrder} />
	</DropDownPanel>
{/snippet}

{#snippet menuContent()}
	<ArcgisSelectionLayerMenu {webMap} {selectionLayers} />
{/snippet}

<div class="map-section">
	{#if webMap}
		<SvelteMapView
			{webMap}
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
