<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import { rehypeGithubAlerts, rehypeInlineTextAdjacentSvgIcons } from '@dsh/common';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	type Props = {
		isOpen: boolean;
		content: string | null;
	};

	let { isOpen = $bindable(false), content }: Props = $props();

	/** Derived state for processing the fetched introduction markdown content into HTML. */
	let introductionHtml: Promise<string | null> = $derived.by(async () => {
		if (!content) {
			return null;
		}

		const htmlRaw = await unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeGithubAlerts)
			.use(rehypeInlineTextAdjacentSvgIcons)
			.use(rehypeStringify)
			.process(content);

		return htmlRaw.toString();
	});
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open: boolean) => (isOpen = open)}>
	<Dialog.Content class="grid w-[700px] max-w-[700px] h-auto max-h-[80vh] overflow-y-auto">
		{#await introductionHtml}
			<p>Loading introduction...</p>
		{:then html}
			<article class="prose-info-markdown">
				{@html html}
			</article>
		{:catch error}
			<p>Error loading introduction: {error.message}</p>
		{/await}
	</Dialog.Content>
</Dialog.Root>
