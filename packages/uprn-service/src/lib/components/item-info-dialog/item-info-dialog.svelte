<script lang="ts">
	import PortalItem from '@arcgis/core/portal/PortalItem.js';
	import esriRequest from '@arcgis/core/request.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import type { IWebMapService } from '$lib/services/web-map-service';

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

	let layerDef: LayerDef | null = $state(null);
	let layerDescription: string | null = $derived.by(() => layerDef?.description ?? null);
	let layerCopyright: string | null = $derived.by(() => layerDef?.copyrightText ?? null);

	const layer: __esri.Layer | __esri.Sublayer | null = $derived.by(() => {
		return activeLayerId ? webmapService.getLayerById(activeLayerId) || null : null;
	});

	$effect(() => {
		if (!isOpen) {
			layerDef = null;
		}
	});

	$effect(() => {
		const localLayer = layer;
		if (!localLayer || localLayer.type === 'sublayer') {
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
			return;
		}

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
				console.log('[ItemInfoDialog] Loaded data:', data, 'for layer:', layer);
			} catch (error) {
				console.error('[ItemInfoDialog] Error loading portal item:', error);
			}
		};

		load(layerUrl);

		return () => {
			cancelled = true;
		};
	});
</script>

{#if layer}
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
