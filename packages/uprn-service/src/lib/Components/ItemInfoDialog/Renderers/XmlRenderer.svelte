<script lang="ts">
	import CopyToClipboardButton from '$lib/Components/CopyToClipboardButton/CopyToClipboardButton.svelte';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import * as Card from '$lib/Components/shadcn/card/index.js';
	import XmlTree from '$lib/Components/XmlTreeview/XmlTreeview.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';

	type Props = {
		content: string;
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

<Card.Root class="w-full self-stretch gap-1 py-2">
	<Card.Header class="mb-0 mt-0 gap-0 pb-0 pt-0">
		<div class="flex w-full items-center justify-end gap-2">
			<CopyToClipboardButton value={content} variant="outline" />

			<Button variant="outline" size="sm" disabled={!content} onclick={() => downloadXml(content)}>
				<ArrowDownToLine />
			</Button>
		</div>
	</Card.Header>
	<Card.Content class="mt-0 pt-0">
		<XmlTree xmlText={content} expandAll={true} />
	</Card.Content>
</Card.Root>
