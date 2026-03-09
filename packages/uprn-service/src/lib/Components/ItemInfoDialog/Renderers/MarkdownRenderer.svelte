<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'md' }>;
	};

	let { content }: Props = $props();
</script>

<p class="w-full max-w-prose self-stretch whitespace-pre-wrap text-sm leading-relaxed">
	{content.text}
</p>
