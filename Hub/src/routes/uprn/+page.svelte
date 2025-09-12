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

<h1>UPRN</h1>
<p>This is the UPRN page.</p>

<SvelteMapView portalId={portalItemId} />
