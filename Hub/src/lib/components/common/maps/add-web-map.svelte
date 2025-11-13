<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import UseFetchWebMaps from '$lib/hooks/use-fetch-web-maps.svelte';
	import { onDestroy, onMount } from 'svelte';
	import esriConfig from '@arcgis/core/config.js';
	import * as urlUtils from '@arcgis/core/core/urlUtils.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type { MapCommandRuntime } from '$lib/types/maps';
	import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js';
	import { asset, base } from '$app/paths';
	import { browser } from '$app/environment';

	type Props = {
		mapView: __esri.MapView | null;
		inputPlaceholder?: string;
		runtime?: MapCommandRuntime | null;
	};

	const { mapView, inputPlaceholder, runtime = null }: Props = $props();
	const useFetchWebMaps = new UseFetchWebMaps();
	let loadingMapId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let query = $state('');

	const filteredMaps = $derived.by(() => {
		const results = useFetchWebMaps.response?.results ?? [];
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return results;
		}

		return results.filter((map) => {
			const title = typeof map?.title === 'string' ? map.title.toLowerCase() : '';
			const description = typeof map?.description === 'string' ? map.description.toLowerCase() : '';
			return title.includes(normalizedQuery) || description.includes(normalizedQuery);
		});
	});

	onMount(async () => {
		const path: string = asset(`/maps-web-map.json`);
		await useFetchWebMaps.fetchWebMaps(path);
	});

	// Track the runtime attachment so we only register handlers when it changes.
	let registeredRuntime: MapCommandRuntime | null = null;
	let detachRuntime: (() => void) | null = null;
	let lastPlaceholder = inputPlaceholder ?? 'Search...';

	$effect(() => {
		const currentRuntime = runtime;
		const placeholderText = inputPlaceholder ?? 'Search...';

		if (!currentRuntime) {
			detachRuntime?.();
			detachRuntime = null;
			registeredRuntime = null;
			query = '';
			lastPlaceholder = placeholderText;
			return;
		}

		if (currentRuntime === registeredRuntime) {
			if (placeholderText !== lastPlaceholder) {
				currentRuntime.setPlaceholder(placeholderText);
				lastPlaceholder = placeholderText;
			}
			return;
		}

		detachRuntime?.();
		detachRuntime = null;
		registeredRuntime = null;
		lastPlaceholder = placeholderText;

		const handleInput = (value: string) => {
			query = value;
		};

		currentRuntime.setPlaceholder(placeholderText);
		currentRuntime.setInputHandler(handleInput);
		const initialValue = currentRuntime.getInputValue();
		query = initialValue;
		if (initialValue) {
			currentRuntime.setInputValue('');
			query = '';
		}

		detachRuntime = () => {
			currentRuntime.setInputHandler(null);
			currentRuntime.resetPlaceholder();
			currentRuntime.setInputValue('');
			if (registeredRuntime === currentRuntime) {
				registeredRuntime = null;
			}
			query = '';
		};

		registeredRuntime = currentRuntime;
	});

	onDestroy(() => {
		detachRuntime?.();
		detachRuntime = null;
		registeredRuntime = null;
	});

	async function setWebMap(itemId: string) {
		if (!browser) {
			return;
		}

		if (!mapView) {
			console.error('MapView is not initialized');
			errorMessage = 'MapView is not ready. Please wait and try again.';
			return;
		}

		loadingMapId = itemId;
		errorMessage = null;

		try {
			console.log(`Loading web map with ID: ${itemId}`);

			const portalUrl = `https://nercdsh.dev.azure.manchester.ac.uk/portal`;
			esriConfig.portalUrl = portalUrl as string;
			console.log('Portal URL configured:', esriConfig.portalUrl);

			const { addProxyRule } = urlUtils;
			console.log('Adding proxy rule for portal traffic');
			addProxyRule({
				urlPrefix: 'https://nercdsh.dev.azure.manchester.ac.uk',
				proxyUrl: `/dsh/proxy/Java/proxy.jsp`
			});

			const [{ default: WebMap }] = await Promise.all([import('@arcgis/core/WebMap')]);
			const webMap = new WebMap({
				portalItem: {
					id: itemId,
					portal: {
						url: portalUrl
					}
				}
			});

			// Load the web map to get its initial viewpoint
			await webMap.load();
			console.log('Web map loaded successfully');

			// Set the map on the MapView
			console.log('Applying web map to MapView', mapView.ui);
			mapView.map = webMap;
			console.log('Web map applied to MapView');

			// Wait for the view to update
			await reactiveUtils.whenOnce(() => mapView.ready);
			console.log('MapView updated with new web map');

			const targetGeometry = webMap.initialViewProperties?.viewpoint?.targetGeometry;
			if (targetGeometry) {
				console.log('Navigating to web map initial viewpoint');
				await mapView.goTo(targetGeometry);
				console.log('MapView navigated to web map initial viewpoint');
			}

			runtime?.setIsOpen(false);
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

	<Command.List>
		{#if filteredMaps.length === 0}
			<Command.Empty>No web maps match your search.</Command.Empty>
		{:else}
			{#each filteredMaps as map (map.id)}
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
		{/if}
	</Command.List>
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
