<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import { Spinner } from '$lib/components/shadcn/spinner';
	import { useFetchHomeIntroductionMarkdown } from '$lib/hooks/use-fetch-home-introduction-markdown.svelte';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	type Props = {
		introductionUrl: string;
	};

	let { introductionUrl }: Props = $props();

	/** Derived state for fetching the introduction content based on the provided URL. */
	let introduction = $derived.by(() => {
		if (!introductionUrl) {
			return null;
		}

		const hook = useFetchHomeIntroductionMarkdown(introductionUrl);
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

{#if introduction?.content}
	<Dialog.Root open={true}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-[9998] bg-black/50" />

			<Dialog.Content
				class="fixed left-1/2 top-1/2 z-[9999] grid -translate-x-1/2 -translate-y-1/2 m-0 p-0 border-none
			 !w-[50vw] !max-w-[50vw] h-[90vh] min-h-0 pt-4 pb-4 overflow-hidden"
			>
				{#await introductionHtml}
					<div class="flex h-full w-full items-center justify-center">
						<Spinner class="w-10 h-10" />
					</div>
				{:then html}
					<ScrollArea class="h-full min-h-0 w-full">
						<article class="prose prose-home-intro-dialog mx-auto w-full max-w-none pt-6 pb-6">
							{@html html}
						</article>
					</ScrollArea>
				{:catch error}
					<p>Error loading introduction: {error.message}</p>
				{/await}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
