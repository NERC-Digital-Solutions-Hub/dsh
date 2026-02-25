<script lang="ts">
	import { Toggle } from '$lib/components/shadcn/toggle/index.js';
	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { getNodeStyles, accentBgStyles, defaultBgStyles } from '../NodeContentStyles.js';
	import type { Component } from 'svelte';

	/**
	 * Props for the NodeContent component.
	 */
	type Props = {
		/** Whether the node can be toggled (for visibility). */
		isTogglable: boolean;
		/** Whether the node is currently pressed/selected. */
		pressed: boolean;
		/** The icon HTML/SVG to display. */
		icon: string | Component;
		/** The display name of the node. */
		name: string;
		/** The depth level for indentation. */
		depth: number;
		/** Click handler function. */
		onclick: () => void;
		/** Additional children to render (e.g., checkboxes). */
		children?: any;
		/** Whether the node is open (for folders). */
		isOpen: boolean;
	};

	const { isTogglable, pressed, icon, name, depth, onclick, children, isOpen }: Props = $props();

	/** Calculate width to account for indentation. */
	const widthCalc = $derived(`calc(100% - ${depth * 1}rem)`);

	const baseClass = getNodeStyles({ enhancedHover: true, includeFont: true });
</script>

{#if isTogglable}
	<Toggle
		{pressed}
		class={`${baseClass} w-full h-auto py-2`}
		variant="outline"
		style="width: {widthCalc};"
		onPressedChange={onclick}
	>
		<div class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2">
			<div class="flex items-center gap-1">
				<span class="inline-block size-4 shrink-0" aria-hidden="true">
					{#if typeof icon === 'string'}
						{@html icon}
					{:else}
						{@const Icon = icon}
						<Icon />
					{/if}
				</span>
			</div>

			<span class="min-w-0 whitespace-normal break-words text-left leading-snug">{name}</span>

			<div class="justify-self-end">
				{@render children?.()}
			</div>
		</div>
	</Toggle>
{:else}
	<Button
		class={`${baseClass} w-full h-auto py-2 ${pressed ? accentBgStyles : defaultBgStyles}`}
		style="width: {widthCalc};"
		{onclick}
	>
		<div class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2">
			<div class="flex items-center gap-1">
				<OpenIndicator {isOpen} />
				<span class="inline-block size-4 shrink-0" aria-hidden="true">
					{#if typeof icon === 'string'}
						{@html icon}
					{:else}
						{@const Icon = icon}
						<Icon />
					{/if}
				</span>
			</div>

			<span class="min-w-0 whitespace-normal break-words text-left leading-snug">{name}</span>

			<div class="justify-self-end">
				{@render children?.()}
			</div>
		</div>
	</Button>
{/if}
