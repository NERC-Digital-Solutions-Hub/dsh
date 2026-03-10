<script lang="ts">
	import PdfIcon from '$lib/Assets/pdf-icon.svg?raw';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';

	import * as Card from '$lib/Components/shadcn/card';
	import { Badge } from '$lib/Components/shadcn/badge';
	import { ExternalLink } from '@lucide/svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'pdf' }>;
	};

	let { content }: Props = $props();
</script>

<a
	href={content.url}
	target="_blank"
	rel="noreferrer"
	class="block w-[70%] mx-auto rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
	<Card.Root class="min-w-0 w-full transition-colors hover:bg-accent/40 hover:border-primary/30">
		<Card.Content class="flex items-start gap-4 px-4">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
				aria-hidden="true"
			>
				<span class="pdf-icon">
					{@html PdfIcon}
				</span>
			</div>

			<div class="min-w-0 flex-1 space-y-1">
				<div class="flex items-center gap-2">
					<h3 class="truncate text-lg font-medium">
						{content.name || 'Open PDF'}
					</h3>
					<Badge variant="secondary">PDF</Badge>
				</div>

				<p class="text-sm text-muted-foreground line-clamp-2">
					{content.description || 'Click to open the PDF file.'}
				</p>
			</div>

			<ExternalLink class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
		</Card.Content>
	</Card.Root>
</a>

<style>
	.pdf-icon :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		display: block;
	}
</style>
