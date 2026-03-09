<script lang="ts">
	import DocxIcon from '$lib/Assets/docx-icon.svg?raw';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'docx' }>;
	};

	let { content }: Props = $props();
</script>

<a
	href={content.url}
	target="_blank"
	rel="noreferrer"
	class="inline-flex items-center gap-2 text-sm underline"
>
	<span class="docx-icon" aria-hidden="true">
		{@html DocxIcon}
	</span>
	<span>{content.name || 'Open DOCX'}</span>
	{#if content.description}
		<p>{content.description}</p>
	{/if}
</a>

<style>
	.docx-icon :global(svg) {
		width: 1rem;
		height: 1rem;
		display: block;
	}
</style>
