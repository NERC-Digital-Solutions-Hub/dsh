<script lang="ts">
	import { Lightbox } from 'svelte-lightbox';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'image' }>;
		index?: number;
	};

	let { content, index = 0 }: Props = $props();
</script>

<Lightbox imagePreset="scroll" enableImageExpand={true}>
	<img
		src={content.url}
		alt={`Metadata image ${index + 1}`}
		class="mx-auto max-h-[420px] w-auto cursor-zoom-in rounded-md object-contain"
	/>
</Lightbox>
