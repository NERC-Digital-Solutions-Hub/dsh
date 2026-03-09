<script lang="ts">
	import esriRequest from '@arcgis/core/request.js';

	type LayerDef = {
		name?: string;
		description?: string;
		copyrightText?: string;
	};

	type Props = {
		layer: __esri.Layer | __esri.Sublayer | null;
	};

	let { layer }: Props = $props();

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

{#if hasLayerDef === null}
	<p class="w-full text-center text-sm italic text-muted-foreground">Loading layer details...</p>
{:else if hasLayerDef === false}
	<p class="w-full text-center text-sm italic text-muted-foreground">Information not available.</p>
{:else}
	<div>
		{#if layerSummary}
			<div>
				<h4 class="pb-2 text-lg font-semibold">Summary</h4>
				<p>{layerSummary}</p>
			</div>
		{/if}

		<div>
			<h4 class="pb-2 text-lg font-semibold">Description</h4>
			<p>{layerDescription ?? 'No description available.'}</p>
		</div>

		<div>
			<h4 class="pb-2 text-lg font-semibold">Credits</h4>
			<p>{layerCredits ?? 'No credits available.'}</p>
		</div>
	</div>
{/if}
