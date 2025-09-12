<script lang="ts">
	import SvelteMapView from '$lib/components/common/map-view.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let portalItemId = '';

	onMount(async () => {
		let appConfig = await fetch(`${base}/app-config.json`).then((res) => res.json()); // TODO: use a store.
		portalItemId = appConfig.portalItemId;
	});
</script>

<div class="map-section">
	{#if portalItemId}
		<SvelteMapView portalId={portalItemId} />
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
