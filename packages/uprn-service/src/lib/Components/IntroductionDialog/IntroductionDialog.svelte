<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import { useFetchAppIntroductionMarkdown } from '$lib/Hooks/UseFetchAppIntroductionMarkdown.svelte';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	type Props = {
		isOpen: boolean;
		contentUrl: string | null;
	};

	let { isOpen = $bindable(true), contentUrl }: Props = $props();

	/** Derived state for fetching the introduction content based on the provided URL. */
	let introduction = $derived.by(() => {
		if (!contentUrl) {
			return null;
		}

		const hook = useFetchAppIntroductionMarkdown(contentUrl);
		hook.fetch();
		return hook;
	});

	/** Derived state for processing the fetched introduction markdown content into HTML. */
	let introductionHtml: Promise<string | null> = $derived.by(async () => {
		if (!introduction || !introduction.content) {
			return null;
		}

		const htmlRaw = await unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeStringify)
			.process(introduction.content);

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
