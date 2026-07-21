<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Types/Metadata.types';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'text' }>;
	};

	let { content }: Props = $props();
</script>

<p class="w-full max-w-prose self-stretch whitespace-pre-wrap text-sm leading-relaxed">
	{content.text}
</p>
