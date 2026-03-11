<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'md' }>;
	};

	let { content }: Props = $props();

	/** Derived state for processing the fetched markdown content into HTML. */
	let textHtml: Promise<string | null> = $derived.by(async () => {
		if (!content.text) {
			return null;
		}

		const htmlRaw = await unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeStringify)
			.process(content.text);

		return htmlRaw.toString();
	});
</script>

{#await textHtml}
	<p>Loading...</p>
{:then html}
	<article class="prose prose-intro-dialog">
		{@html html}
	</article>
{:catch error}
	<p>Error loading content: {error.message}</p>
{/await}
