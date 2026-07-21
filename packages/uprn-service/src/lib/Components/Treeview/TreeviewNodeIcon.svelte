<script lang="ts">
	import type { Component } from 'svelte';
	import SanitizedHtml from '$lib/Components/SanitizedHtml/SanitizedHtml.svelte';
	import { trustLocalIconHtml } from '$lib/Utilities/richText';
	import { cn } from '$lib/utils';

	/**
	 * Renders either an SVG string or Svelte component icon inside a stable tree icon slot.
	 */
	type Props = {
		icon: string | Component;
		class?: string;
	};

	const { icon, class: className }: Props = $props();
</script>

<span class={cn('icon-slot', className)}>
	{#if typeof icon === 'string'}
		<SanitizedHtml html={trustLocalIconHtml(icon)} />
	{:else}
		{@const Icon = icon}
		<Icon />
	{/if}
</span>
