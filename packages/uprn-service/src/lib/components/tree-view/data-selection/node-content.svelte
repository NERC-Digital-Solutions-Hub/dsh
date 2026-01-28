<script lang="ts">
	import type { Snippet } from 'svelte';
	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { getNodeStyles } from '../node-content-styles.js';
	import { Button } from '$lib/components/shadcn/button/index.js';

	/**
	 * Props for the NodeContent component.
	 */
	type Props = {
		/** The icon HTML/SVG to display. */
		icon: string;
		/** The display name of the node. */
		name: string;
		/** The depth level for indentation. */
		depth: number;
		/** Click handler function. */
		onclick: () => void;
		/** Additional children to render. */
		children?: Snippet;
		/** Whether this is a folder node. */
		isFolder?: boolean;
		/** Whether the folder is open. */
		isOpen?: boolean;
	};

	const {
		icon,
		name,
		depth,
		onclick,
		children,
		isFolder = false,
		isOpen = false
	}: Props = $props();

	/** The width to account for indentation. */
	const widthCalc = $derived(`calc(100% - ${depth * 1}rem)`);
</script>

<Button
	class={`${getNodeStyles({ enhancedHover: true, includeFont: true })} w-full h-auto py-2`}
	style="width: {widthCalc};"
	{onclick}
>
	<div class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2">
		<div class="flex items-center gap-1">
			{#if isFolder}
				<OpenIndicator {isOpen} />
			{/if}
			<span class="inline-block size-4 shrink-0" aria-hidden="true">
				{@html icon}
			</span>
		</div>

		<span class="min-w-0 whitespace-normal break-words text-left leading-snug">
			{name}
		</span>

		<div class="justify-self-end">
			{@render children?.()}
		</div>
	</div>
</Button>
