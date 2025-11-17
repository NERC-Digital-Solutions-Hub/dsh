<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import { onDestroy, onMount } from 'svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import type { MapCommandRuntime, MapsOrganisationConfig, WebMapMetadata } from '$lib/types/maps';
	import { browser } from '$app/environment';
	import type { CommandSearchContext } from '$lib/services/command-search/command-search-context';
	import { MapsConfig } from '$lib/models/maps-config';
	import UseEsriRequest from '$lib/hooks/use-esri-request.svelte';
	import { OrganisationCommandService } from '$lib/services/command-search/organisation-command-service';
	import { cleanHtmlText } from '$lib/utils/decode-html';
	import { base } from '$app/paths';

	type Props = {
		commandSearchContext: CommandSearchContext;
		mapView: __esri.MapView | null;
		inputPlaceholder?: string;
		runtime?: MapCommandRuntime | null;
	};

	const { commandSearchContext, mapView, inputPlaceholder, runtime = null }: Props = $props();
	const useEsriRequest = new UseEsriRequest();
	let loadingMapId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let query = $state('');

	let webMapMetadata: WebMapMetadata[] = $state([]);

	const filteredMaps = $derived.by(() => {
		const results = webMapMetadata;
		console.log('Filtering web maps with data:', results);
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return results;
		}

		return results.filter((map) => {
			const title = map?.title?.toLowerCase() ?? '';
			const description = map?.description?.toLowerCase() ?? '';
			return title.includes(normalizedQuery) || description.includes(normalizedQuery);
		});
	});

	onMount(async () => {
		if (!browser) {
			return;
		}

		const organisationService = commandSearchContext.get(OrganisationCommandService);
		const activeOrgId = organisationService.getActiveOrganisationId();
		if (!activeOrgId) {
			console.warn('No active organisation selected in OrganisationCommandService');
			return;
		}

		try {
			// Fetch from the API endpoint instead of directly from portal
			console.log(
				'Fetching web maps for organisation ID:',
				activeOrgId,
				'url',
				`${base}/api/maps?id=${activeOrgId}`
			);
			const response = await fetch(`${base}/api/maps?id=${activeOrgId}`);
			console.log(
				'Fetched web maps response:',
				response,
				'url',
				`${base}/api/maps?id=${activeOrgId}`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch maps: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();

			// Filter for Web Maps and map to metadata
			webMapMetadata = (data.results ?? [])
				.filter((item: any) => item.type.toLowerCase() === 'web map')
				.map((item: any) => ({
					id: item.id,
					title: item.title,
					description: cleanHtmlText(item.description),
					owner: item.owner,
					tags: item.tags
				}));
		} catch (error) {
			console.error('Error fetching web maps:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to fetch web maps';
		}
	});

	let detachRuntimeInput: (() => void) | null = null;
	let attachedRuntime: MapCommandRuntime | null = null;
	let attachedPlaceholder = inputPlaceholder ?? 'Search...';

	$effect(() => {
		const currentRuntime = runtime;
		const placeholderText = inputPlaceholder ?? 'Search...';

		if (!currentRuntime) {
			detachRuntimeInput?.();
			detachRuntimeInput = null;
			attachedRuntime = null;
			attachedPlaceholder = placeholderText;
			query = '';
			return;
		}

		if (currentRuntime === attachedRuntime) {
			if (placeholderText !== attachedPlaceholder) {
				currentRuntime.setPlaceholder(placeholderText);
				attachedPlaceholder = placeholderText;
			}
			return;
		}

		detachRuntimeInput?.();
		detachRuntimeInput = null;
		attachedPlaceholder = placeholderText;

		detachRuntimeInput = currentRuntime.attachInputBinding({
			placeholder: placeholderText,
			onInput: (value) => {
				query = value;
			}
		});

		attachedRuntime = currentRuntime;
	});

	onDestroy(() => {
		detachRuntimeInput?.();
		detachRuntimeInput = null;
		attachedRuntime = null;
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

			// const portalUrl = `https://nercdsh.dev.azure.manchester.ac.uk/portal`;
			// esriConfig.portalUrl = portalUrl as string;
			// console.log('Portal URL configured:', esriConfig.portalUrl);

			// const { addProxyRule } = urlUtils;
			// console.log('Adding proxy rule for portal traffic');
			// addProxyRule({
			// 	urlPrefix: 'https://nercdsh.dev.azure.manchester.ac.uk',
			// 	proxyUrl: `${base}/proxy/Java/proxy.jsp`
			// });

			const organisationService = commandSearchContext.get(OrganisationCommandService);
			const activeOrgId = organisationService.getActiveOrganisationId();
			if (!activeOrgId) {
				console.warn('No active organisation selected in OrganisationCommandService');
				return;
			}

			const portalUrl: string = organisationService.getActiveOrganisationPortalUrl();

			const { default: WebMap } = await import('@arcgis/core/WebMap');
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
			const reactiveUtils = await import('@arcgis/core/core/reactiveUtils.js');
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
	{#if useEsriRequest.error}
		<div class="error-message">
			<p class="text-sm text-red-600">
				{useEsriRequest.error.message}. {useEsriRequest.error?.details?.httpStatus === 0
					? 'Reason: CORS Error. See console for more information.'
					: ''}
			</p>
		</div>
	{:else if useEsriRequest.isLoading}
		<div class="flex items-center justify-center p-4">
			<Spinner class="size-5" />
		</div>
	{:else}
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
								<span class="title-text font-medium text-foreground" title={map.title}>
									{map.title ?? 'Untitled web map'}
								</span>
								{#if map.description}
									<span class="description-text text-xs text-gray-500" title={map.description}>
										{map.description}
									</span>
								{/if}
							</div>
						{/if}
					</Command.Item>
				{/each}
			{/if}
		</Command.List>
	{/if}
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
