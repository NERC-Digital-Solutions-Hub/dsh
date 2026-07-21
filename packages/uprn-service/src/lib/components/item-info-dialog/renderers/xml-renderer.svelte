<script lang="ts">
	import CopyToClipboardButton from '$lib/components/copy-to-clipboard-button/copy-to-clipboard-button.svelte';
	import type { MetadataResolvedContent } from '$lib/types/metadata.types';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Card from '$lib/components/shadcn/card/index.js';
	import XmlTree from '$lib/components/xml-treeview/xml-treeview.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';

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

<Card.Root class="group w-full h-full gap-0 py-0">
	<Card.Content class="relative h-full overflow-hidden py-4 px-0">
		<div
			class="absolute top-4 right-4 z-10 flex gap-2 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-60 group-hover:pointer-events-auto group-focus-within:opacity-60 group-focus-within:pointer-events-auto"
		>
			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-pointer">
						<CopyToClipboardButton value={content.text} title="" variant="outline" />
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
