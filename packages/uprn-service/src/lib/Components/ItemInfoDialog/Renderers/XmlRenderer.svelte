<script lang="ts">
	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import XmlTree from '$lib/Components/XmlTreeview/XmlTreeview.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';

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
	<Card.Content class="relative h-full overflow-hidden p-4">
		<div class="absolute top-4 right-4 z-10 flex gap-2 opacity-60">
			<CopyToClipboardButton value={content.text} variant="outline" />

			<Button
				variant="outline"
				size="sm"
				disabled={!content.text}
				onclick={() => downloadXml(content.text)}
			>
				<ArrowDownToLine />
			</Button>
		</div>

		<ScrollArea class="h-full w-full">
			<XmlTree xmlText={content.text} expandAll={true} />
		</ScrollArea>
	</Card.Content>
</Card.Root>
