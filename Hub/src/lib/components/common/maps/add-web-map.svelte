<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onMount } from 'svelte';
	import esriConfig from '@arcgis/core/config.js';
	import * as urlUtils from '@arcgis/core/core/urlUtils.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import CommandItem from '$lib/components/ui/command/command-item.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	type Props = {
		mapView: __esri.MapView;
	};

	const { mapView }: Props = $props();

	const useFetchWebMaps = new UseFetchWebMaps();
	let loadingMapId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		await useFetchWebMaps.fetchWebMaps('/maps-web-map.json');
	});

	async function setWebMap(itemId: string) {
		if (!mapView) {
			console.error('MapView is not initialized');
			errorMessage = 'MapView is not ready. Please wait and try again.';
			return;
		}

		loadingMapId = itemId;
		errorMessage = null;

		try {
			console.log(`Loading web map with ID: ${itemId}`);

			const [{ default: WebMap }] = await Promise.all([import('@arcgis/core/WebMap')]);

			const portalUrl = `https://nercdsh.dev.azure.manchester.ac.uk/portal`;
			esriConfig.portalUrl = portalUrl as string;
			console.log('Portal URL configured:', esriConfig.portalUrl);

			const { addProxyRule } = urlUtils;
			console.log('Adding proxy rule for portal traffic');
			addProxyRule({
				urlPrefix: 'https://nercdsh.dev.azure.manchester.ac.uk',
				proxyUrl: '/proxy/Java/proxy.jsp'
			});

			const webMap = new WebMap({
				portalItem: {
					id: itemId,
					portal: {
						url: portalUrl
					}
				}
			});

			console.log('Loading web map...');
			// Load the web map to get its initial viewpoint
			await webMap.load();
			console.log('Web map loaded successfully');

			// Set the map on the MapView
			mapView.map = webMap;
			console.log('Web map applied to MapView');

			// Wait for the view to update
			await mapView.when();
			console.log('MapView updated with new web map');
		} catch (error) {
			console.error('Error loading web map:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to load web map';
		} finally {
			loadingMapId = null;
		}
	}
</script>

<div class="item-container">
	{#if errorMessage}
		<div class="error-message">
			<p class="text-sm text-red-600">{errorMessage}</p>
		</div>
	{/if}

	<!-- {#each useFetchWebMaps.response?.results as map (map.id)}
		<Button
			class={`map-button relative mt-2 flex w-full cursor-default flex-col gap-1 rounded-sm bg-gray-100 px-3 py-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground${map.description ? ' map-button-with-description' : ''}`}
			onclick={() => setWebMap(map.id)}
			disabled={loadingMapId !== null}
		>
			{#if loadingMapId === map.id}
				<div class="flex items-center gap-2">
					<Spinner class="size-4" />
					<span class="title-text w-full font-medium text-foreground">
						Loading {map.title ?? 'Untitled web map'}...
					</span>
				</div>
			{:else}
				<span class="title-text w-full font-medium text-foreground">
					{map.title ?? 'Untitled web map'}
				</span>
				{#if map.description}
					<span class="description-text w-full text-xs text-gray-500">
						{map.description}
					</span>
				{/if}
			{/if}
		</Button>
	{/each} -->
	<Command.Root>
		<Command.Input placeholder="Search web maps..." />
		<Command.List>
			<Command.Empty>No results found.</Command.Empty>
			<Command.Group heading="Web Map(s)">
				{#each useFetchWebMaps.response?.results as map (map.id)}
					<Command.Item onclick={() => setWebMap(map.id)}>
						{#if loadingMapId === map.id}
							<div class="flex items-center gap-2">
								<Spinner class="size-4" />
								<span class="title-text w-full font-medium text-foreground">
									Loading {map.title ?? 'Untitled web map'}...
								</span>
							</div>
						{:else}
							<div class="flex w-full min-w-0 flex-col gap-0.5">
								<span class="title-text font-medium text-foreground">
									{map.title ?? 'Untitled web map'}
								</span>
								{#if map.description}
									<span class="description-text text-xs text-gray-500">
										{map.description}
									</span>
								{/if}
							</div>
						{/if}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.List>
	</Command.Root>
</div>

<style>
	.item-container {
		max-width: 40vw;
		max-height: 500px;
		margin-left: 0.75rem;
		margin-right: 0.75rem;
	}

	.error-message {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background-color: #fee;
		border-radius: 0.375rem;
		border: 1px solid #fcc;
	}

	:global(.map-button) {
		align-items: stretch;
		text-align: left;
		min-height: 2.5rem;
	}

	:global(.map-button:disabled) {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.map-button-with-description) {
		min-height: 3.25rem;
	}

	.title-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}

	.description-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.2;
	}
</style>
