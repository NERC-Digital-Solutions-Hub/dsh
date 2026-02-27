<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { getNodeStyles } from '../NodeContentStyles.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import type { TagDefinition } from '$lib/Types/Configuration.types.js';

	/**
	 * Props for the NodeContent component.
	 */
	type Props = {
		/** The icon HTML/SVG to display. */
		icon: string | Component;
		/** The display name of the node. */
		name: string;
		/** The depth level for indentation. */
		depth: number;
		/** Optional tag definitions associated with the node. */
		tagDefinitions?: TagDefinition[];
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
		tagDefinitions,
		onclick,
		children,
		isFolder = false,
		isOpen = false
	}: Props = $props();

	/** The width to account for indentation. */
	const widthCalc = $derived(`calc(100% - ${depth * 1}rem)`);
</script>

<Button
	class={`${getNodeStyles({ enhancedHover: true, includeFont: true })} relative w-full h-auto py-2 overflow-hidden`}
	style="width: {widthCalc};"
	{onclick}
>
	{#if tagDefinitions && tagDefinitions.length > 0}
		<div class="tag-rail-left" aria-hidden="true">
			{#each tagDefinitions as tagDef (tagDef.id)}
				<!-- <span class="tag-line" style={`background-color: ${tagDef.color};`}></span> -->
			{/each}
		</div>
	{/if}

	<div class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2">
		<div class="flex items-center gap-1">
			{#if isFolder}
				<OpenIndicator {isOpen} />
			{/if}
			<span class="inline-block size-4 shrink-0" aria-hidden="true">
				{#if typeof icon === 'string'}
					{@html icon}
				{:else}
					{@const Icon = icon}
					<Icon />
				{/if}
			</span>
		</div>

		<span class="min-w-0 whitespace-normal break-words text-left leading-snug">
			{name}
		</span>

		<div class="justify-self-end flex items-center justify-end gap-2">
			{@render children?.()}
		</div>
	</div>
</Button>

<style>
	.tag-rail-left {
		position: absolute;
		left: 0px;
		top: 0;
		bottom: 0;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 3px;
		gap: 0;
		padding: 0;
		pointer-events: none;
		z-index: 1;
	}

	.tag-line {
		display: block;
		width: 3px;
		height: 100%;
		box-sizing: border-box;
		border-radius: 0;
	}
</style>
