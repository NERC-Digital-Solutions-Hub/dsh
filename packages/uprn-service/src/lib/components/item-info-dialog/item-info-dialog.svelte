<script lang="ts">
	import esriRequest from '@arcgis/core/request.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import type { IWebMapService } from '$lib/services/IWebMapService';

	type LayerDef = {
		name?: string;
		description?: string;
		copyrightText?: string;
	};

	type Props = {
		webmapService: IWebMapService;
		isOpen: boolean;
		activeLayerId: string | null;
	};

	let { webmapService, isOpen = $bindable(), activeLayerId = $bindable() }: Props = $props();

	let hasLayerDef: boolean | null = $state(null);
	let layerDef: LayerDef | null = $state(null);
	let layerDescription: string | null = $state(null);
	let layerCopyright: string | null = $state(null);

	const layer: __esri.Layer | __esri.Sublayer | null = $derived.by(() => {
		return activeLayerId ? webmapService.getLayerById(activeLayerId) || null : null;
	});

	$effect(() => {
		if (!isOpen) {
			hasLayerDef = null;
			layerDef = null;
		}
	});

	$effect(() => {
		const open = isOpen;
		if (!open) {
			return;
		}

		const localLayer = layer;
		if (!localLayer || localLayer.type === 'sublayer') {
			hasLayerDef = false;
			layerDef = null;
			return;
		}

		let cancelled = false;

		const parsedLayer = localLayer as __esri.FeatureLayer & {
			parsedUrl: { path: string };
		};
		const layerUrl: string | undefined = parsedLayer?.parsedUrl?.path;
		if (!layerUrl) {
			console.log('[ItemInfoDialog] No URL found for layer:', layer);
			hasLayerDef = false;
			return;
		}

		hasLayerDef = true;
		const load = async (url: string) => {
			try {
				const { data } = await esriRequest(url, {
					query: { f: 'json' },
					responseType: 'json'
				});
				if (cancelled) {
					hasLayerDef = false;
					return;
				}

				layerDef = data;
				layerDescription = layerDef?.description || null;
				layerCopyright = layerDef?.copyrightText || null;
				//console.log('[ItemInfoDialog] Loaded data:', data, 'for layer:', layer);
			} catch (error) {
				hasLayerDef = false;
				console.error('[ItemInfoDialog] Error loading portal item:', error);
			}
		};

		load(layerUrl);

		return () => {
			hasLayerDef = null;
			cancelled = true;
		};
	});
</script>

{#if layer && (hasLayerDef == false || (hasLayerDef == true && layerDef))}
	<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
		<Dialog.Content
			class="flex max-h-[80vh] min-h-0 flex-col gap-4 overflow-hidden sm:max-w-[700px]"
		>
			<Dialog.Header>
				<Dialog.Title>{layer.title ?? 'Name not found'}</Dialog.Title>
				<Dialog.Description>Dataset Information</Dialog.Description>
			</Dialog.Header>
			<div class="flex-1 min-h-0 overflow-y-auto pr-4">
				<div class="flex flex-col gap-4">
					<p class="mx-auto max-w-prose text-center text-sm italic text-muted-foreground">
						WORK IN PROGRESS. The information that will be shown here includes metadata, source
						details (e.g. organisation and contact information), and other relevant information to
						help users understand the data.
					</p>

					{#if layerDescription}
						<div>
							<h4 class="text-lg font-semibold pb-2">Description</h4>
							<p class="whitespace-pre-wrap text-sm leading-relaxed">{layerDescription}</p>
						</div>
					{/if}

					{#if layerCopyright}
						<div>
							<h4 class="text-lg font-semibold pb-2">Copyright</h4>
							<p class="whitespace-pre-wrap text-sm leading-relaxed">{layerCopyright}</p>
						</div>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
