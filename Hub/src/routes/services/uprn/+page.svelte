<script lang="ts">
	import SvelteMapView from '$lib/components/common/map-view.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let portalUrl = '';
	let url = '';
	let portalId = '';
	let proxy: any = null;

	onMount(async () => {
		let appConfig = await fetch(`${base}/app-config.json`).then((res) => res.json()); // TODO: use a store.
		portalUrl = appConfig.portalUrl;
		url = appConfig.url;
		portalId = appConfig.portalItemId;
		proxy = appConfig.proxy;
	});
</script>

<div class="map-section">
	{#if portalId}
		<SvelteMapView {portalUrl} {portalId} {proxy} />
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
