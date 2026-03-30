<script lang="ts">
	import {
		Card,
		CardContent
	} from '$lib/components/shadcn/card';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import type { SummaryResolvedContent } from '$lib/types/summary.types';

	type Props = {
		content: Extract<SummaryResolvedContent, { type: 'html' }>;
	};

	let { content }: Props = $props();
</script>

<Card class="h-full w-full gap-0 py-0 shadow-none">
	<CardContent class="h-full overflow-hidden px-0 py-4">
		<ScrollArea class="h-full w-full px-3">
			<article class="prose-info-markdown max-w-none">
				{@html content.text}
			</article>
		</ScrollArea>
	</CardContent>
</Card>
