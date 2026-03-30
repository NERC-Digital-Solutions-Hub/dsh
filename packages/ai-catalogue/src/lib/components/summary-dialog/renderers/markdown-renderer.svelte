<script lang="ts">
	import { renderMarkdownToHtml } from '@dsh/common';
	import { Button } from '$lib/components/shadcn/button';
	import { Card, CardContent } from '$lib/components/shadcn/card';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip';
	import type { SummaryResolvedContent } from '$lib/types/summary.types';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';

	type Props = {
		content: Extract<SummaryResolvedContent, { type: 'md' }>;
	};

	let { content }: Props = $props();

	let textHtml: Promise<string | null> = $derived.by(async () => {
		if (!content.text) {
			return null;
		}

		return await renderMarkdownToHtml(content.text);
	});

	async function copyMarkdown(value: string) {
		if (!value || !navigator?.clipboard) {
			return;
		}

		await navigator.clipboard.writeText(value);
	}

	function downloadMarkdown(value: string, filename = 'summary.md') {
		if (!value) {
			return;
		}

		const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}
</script>

<Card class="group h-full w-full gap-0 py-0 shadow-none">
	<CardContent class="relative h-full overflow-hidden px-0 py-4">
		<div
			class="pointer-events-none absolute top-4 right-4 z-10 flex gap-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
		>
			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Copy"
							disabled={!content.text}
							onclick={() => void copyMarkdown(content.text)}
						>
							<CopyIcon />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Copy</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Download"
							disabled={!content.text}
							onclick={() => downloadMarkdown(content.text)}
						>
							<DownloadIcon />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Download</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<ScrollArea class="h-full w-full px-3">
			{#await textHtml}
				<p class="text-sm text-muted-foreground">Loading...</p>
			{:then html}
				<article class="prose-info-markdown max-w-none">
					{@html html}
				</article>
			{:catch error}
				<p class="text-sm text-destructive">Error loading content: {error.message}</p>
			{/await}
		</ScrollArea>
	</CardContent>
</Card>
