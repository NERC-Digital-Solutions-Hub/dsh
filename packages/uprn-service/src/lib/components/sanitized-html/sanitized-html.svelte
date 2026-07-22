<script lang="ts">
	import type { SanitizedHtml } from '$lib/utilities/rich-text';

	type Props = { html: SanitizedHtml | null };
	const { html }: Props = $props();
</script>

{#if html}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML is branded only after sanitization. -->
	{@html html}
{/if}
