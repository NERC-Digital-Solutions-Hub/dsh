<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { useFetchAppIntroductionMarkdown } from '$lib/Hooks/UseFetchAppIntroductionMarkdown.svelte';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	type Props = {
		contentUrl: string | null;
	};

	let { contentUrl }: Props = $props();

	/** State for managing the visibility of the dialog. */
	let isOpen = $state(true);

	/** Derived state for fetching the introduction content based on the provided URL. */
	let introduction = $derived.by(() => {
		if (!contentUrl) {
			return null;
		}

		const hook = useFetchAppIntroductionMarkdown(contentUrl);
		hook.fetch();
		return hook;
	});

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

		console.log('Processed HTML:', htmlRaw.toString());
		return htmlRaw.toString();
	});
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
	<Dialog.Content class="grid w-[400px] max-w-[400px] max-h-[400px] min-h-[400px] overflow-hidden">
		{#await introductionHtml}
			<p>Loading introduction...</p>
		{:then html}
			<article class="prose prose-intro-dialog">
				{@html html}
			</article>
		{:catch error}
			<p>Error loading introduction: {error.message}</p>
		{/await}
	</Dialog.Content>
</Dialog.Root>
