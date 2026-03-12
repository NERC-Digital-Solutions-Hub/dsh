<script lang="ts">
	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import { ArrowDownToLine } from '@lucide/svelte';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';
	import { unified } from 'unified';
	import rehypeReferences from '$lib/Components/ItemInfoDialog/Renderers/Rehype/RehypeReferences';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'md' }>;
	};

	let { content }: Props = $props();

	function downloadMarkdown(value: string, filename = 'metadata.md') {
		if (!value) return;
		const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	/** Derived state for processing the fetched markdown content into HTML. */
	let textHtml: Promise<string | null> = $derived.by(async () => {
		if (!content.text) {
			return null;
		}

		const htmlRaw = await unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeReferences)
			.use(rehypeStringify)
			.process(content.text);

		console.log('Processed HTML:', htmlRaw.toString());

		return htmlRaw.toString();
	});
</script>

<Card.Root class="w-full h-full gap-0 py-0">
	<Card.Content class="relative h-full overflow-hidden py-4 px-0">
		<div class="absolute top-4 right-4 z-10 flex gap-2 opacity-60">
			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-pointer">
						<CopyToClipboardButton value={content.text} title={''} variant="outline" />
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Copy</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-pointer">
						<Button
							variant="outline"
							size="sm"
							disabled={!content.text}
							onclick={() => downloadMarkdown(content.text)}
						>
							<ArrowDownToLine />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Download</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<ScrollArea class="h-full w-full px-3">
			{#await textHtml}
				<p>Loading...</p>
			{:then html}
				<article class="prose prose-info-markdown">
					{@html html}
				</article>
			{:catch error}
				<p>Error loading content: {error.message}</p>
			{/await}
		</ScrollArea>
	</Card.Content>
</Card.Root>
