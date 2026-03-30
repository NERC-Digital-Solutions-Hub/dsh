<script lang="ts">
	import {
		Card,
		CardContent
	} from '$lib/components/shadcn/card';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import type { SummaryResolvedContent } from '$lib/types/summary.types';

	type Props = {
		content: Extract<SummaryResolvedContent, { type: 'xml' | 'text' }>;
	};

	let { content }: Props = $props();
</script>

<Card class="h-full w-full gap-0 py-0 shadow-none">
	<CardContent class="h-full overflow-hidden px-0 py-4">
		<ScrollArea class="h-full w-full px-3">
			<pre
				class="overflow-x-auto rounded-md border bg-muted/20 p-4 text-sm leading-6 whitespace-pre-wrap text-foreground"
			>
{content.text}</pre
			>
		</ScrollArea>
	</CardContent>
</Card>
