<script lang="ts">
	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import XmlTree from '$lib/Components/XmlTreeview/XmlTreeview.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tooltip from '$lib/Components/shadcn/tooltip/index.js';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'xml' }>;
	};

	let { content }: Props = $props();

	function downloadXml(value: string, filename = 'metadata.xml') {
		if (!value) return;
		const blob = new Blob([value], { type: 'application/xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
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
							onclick={() => downloadXml(content.text)}
						>
							<ArrowDownToLine />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Download</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<ScrollArea class="h-full w-full px-3">
			<XmlTree xmlText={content.text} expandAll={true} />
		</ScrollArea>
	</Card.Content>
</Card.Root>
