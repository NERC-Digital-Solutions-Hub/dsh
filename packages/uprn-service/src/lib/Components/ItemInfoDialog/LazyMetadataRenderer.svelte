<script lang="ts">
	import type { MetadataResolvedContent, MetadataTabContentItem } from '$lib/Types/Metadata.types';
	import type { MetadataRendererComponent } from './metadataRenderers';
	import { loadMetadataRenderer } from './metadataRenderers';

	type Props = {
		type: MetadataTabContentItem['type'];
		content: MetadataResolvedContent;
		index?: number;
		layer?: __esri.Layer | __esri.Sublayer | null;
	};

	const { type, content, index, layer }: Props = $props();
	let Renderer = $state<MetadataRendererComponent | null>(null);
	let error = $state<unknown>(null);

	$effect(() => {
		let cancelled = false;
		Renderer = null;
		error = null;
		void loadMetadataRenderer(type)
			.then((component) => {
				if (!cancelled) Renderer = component;
			})
			.catch((loadError) => {
				if (!cancelled) error = loadError;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if error}
	<p class="w-full text-center text-sm italic text-destructive">Unable to load renderer.</p>
{:else if Renderer}
	<Renderer {content} {index} {layer} />
{:else}
	<p class="w-full text-center text-sm italic text-muted-foreground">Loading renderer...</p>
{/if}
