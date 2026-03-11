<script lang="ts">
	import esriRequest from '@arcgis/core/request.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/Components/shadcn/card';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	type LayerDef = {
		name?: string;
		description?: string;
		copyrightText?: string;
	};

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'arcgisInfo' }>;
		layer?: __esri.Layer | __esri.Sublayer | null;
	};

	let { layer = null }: Props = $props();

	let hasLayerDef: boolean | null = $state(null);
	let layerDef: LayerDef | null = $state(null);
	let layerSummary: string | null = $state(null);
	let layerDescription: string | null = $state(null);
	let layerCredits: string | null = $state(null);
	let previousLayer: __esri.Layer | __esri.Sublayer | null = $state(null);

	function clearLayerMetadataState(nextHasLayerDef: boolean | null = null) {
		hasLayerDef = nextHasLayerDef;
		layerDef = null;
		layerSummary = null;
		layerDescription = null;
		layerCredits = null;
	}

	$effect(() => {
		const localLayer = layer;

		if (previousLayer !== localLayer) {
			clearLayerMetadataState(null);
			previousLayer = localLayer;
		}

		if (!localLayer || localLayer.type === 'sublayer') {
			clearLayerMetadataState(false);
			return;
		}

		let cancelled = false;

		const parsedLayer = localLayer as __esri.FeatureLayer & {
			parsedUrl: { path: string };
		};

		const layerUrl: string | undefined = parsedLayer?.parsedUrl?.path;
		if (!layerUrl) {
			console.log('[ArcgisInfoRenderer] No URL found for layer:', localLayer);
			clearLayerMetadataState(false);
			return;
		}

		hasLayerDef = null;
		const load = async (url: string) => {
			console.log('[ArcgisInfoRenderer] Loading layer metadata from URL:', url);
			try {
				const { data } = await esriRequest(url, {
					query: { f: 'json' },
					responseType: 'json'
				});
				if (cancelled) {
					return;
				}

				layerDef = data;
				hasLayerDef = true;
				layerSummary = layerDef?.name || null;
				layerDescription = layerDef?.description || null;
				layerCredits = layerDef?.copyrightText || null;
				console.log('[ArcgisInfoRenderer] Loaded data for layer:', localLayer);
			} catch (error) {
				clearLayerMetadataState(false);
				console.error('[ArcgisInfoRenderer] Error loading layer metadata:', error);
			}
		};

		load(layerUrl);

		return () => {
			cancelled = true;
		};
	});
</script>

<Card class="h-full w-full">
	<ScrollArea class="h-full w-full">
		{#if hasLayerDef === null}
			<div class="p-6">
				<p class="w-full text-center text-sm italic text-muted-foreground">
					Loading layer details...
				</p>
			</div>
		{:else if hasLayerDef === false}
			<div class="p-6">
				<p class="w-full text-center text-sm italic text-muted-foreground">
					Information not available.
				</p>
			</div>
		{:else}
			<CardHeader class="space-y-3">
				<CardTitle class="text-2xl leading-tight">{layerSummary ?? 'Layer information'}</CardTitle>
				{#if layerDescription}
					<CardDescription class="text-sm text-muted-foreground">
						ArcGIS service metadata and attribution details.
					</CardDescription>
				{/if}
			</CardHeader>

			<CardContent class="space-y-6">
				<section class="space-y-2">
					<h2 class="text-base font-semibold">Description</h2>
					<p class="text-sm leading-6 text-muted-foreground">
						{layerDescription ?? 'No description available.'}
					</p>
				</section>

				<section class="space-y-3 border-t pt-6">
					<div class="rounded-lg bg-muted/40 p-4">
						<h2 class="text-base font-semibold">Credits</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							{layerCredits ?? 'No credits available.'}
						</p>
					</div>
				</section>
			</CardContent>
		{/if}
	</ScrollArea>
</Card>
