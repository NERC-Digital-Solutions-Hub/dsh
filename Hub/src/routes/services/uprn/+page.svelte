<script lang="ts">
	import SvelteMapView from '$lib/components/common/map-view.svelte';
	import { getAppConfigAsync, type AppConfig } from '$lib/utils/app-config-provider.js';
	import { onMount } from 'svelte';

	let portalItemId = '';

	onMount(async () => {
		const appConfig: AppConfig = await getAppConfigAsync();
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
