<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import SanitizedHtml from '$lib/Components/SanitizedHtml/SanitizedHtml.svelte';
	import {
		renderMarkdownToSanitizedHtml,
		type SanitizedHtml as SanitizedHtmlValue
	} from '$lib/Utilities/richText';

	type Props = {
		isOpen: boolean;
		content: string | null;
	};

	let { isOpen = $bindable(false), content }: Props = $props();

	/** Derived state for processing the fetched introduction markdown content into HTML. */
	let introductionHtml: Promise<SanitizedHtmlValue | null> = $derived.by(async () => {
		if (!content) {
			return null;
		}

		return renderMarkdownToSanitizedHtml(content);
	});
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open: boolean) => (isOpen = open)}>
	<Dialog.Content class="grid w-[700px] max-w-[700px] h-auto max-h-[80vh] overflow-y-auto">
		{#await introductionHtml}
			<p>Loading introduction...</p>
		{:then html}
			<article class="prose-info-markdown">
				<SanitizedHtml {html} />
			</article>
		{:catch error}
			<p>Error loading introduction: {error.message}</p>
		{/await}
	</Dialog.Content>
</Dialog.Root>
