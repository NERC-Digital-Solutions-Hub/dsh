<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import { Spinner } from '$lib/components/shadcn/spinner';
	import { renderHomeIntroductionMarkdown } from '$lib/markdown/render-home-introduction-markdown';

	type Props = {
		introduction: string | null;
	};

	let { introduction }: Props = $props();

	/** Derived state for processing the fetched introduction markdown content into HTML. */
	let introductionHtml: Promise<string | null> = $derived.by(async () => {
		if (!introduction) {
			return null;
		}

		return await renderHomeIntroductionMarkdown(introduction);
	});
</script>

{#if introduction}
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
					<ScrollArea class="h-full min-h-0 w-full pl-7 pr-7">
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
