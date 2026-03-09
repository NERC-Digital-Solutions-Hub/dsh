<script lang="ts">
	import PdfIcon from '$lib/Assets/pdf-icon.svg?raw';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'pdf' }>;
	};

	let { content }: Props = $props();
</script>

<a
	href={content.url}
	target="_blank"
	rel="noreferrer"
	class="inline-flex items-center gap-2 text-sm underline"
>
	<span class="pdf-icon" aria-hidden="true">
		{@html PdfIcon}
	</span>
	<span>{content.name || 'Open PDF'}</span>
	{#if content.description}
		<p>{content.description}</p>
	{/if}
</a>

<style>
	.pdf-icon :global(svg) {
		width: 1rem;
		height: 1rem;
		display: block;
	}
</style>
