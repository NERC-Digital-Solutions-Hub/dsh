<script lang="ts">
	import OpenIndicator from '$lib/Components/OpenIndicator/OpenIndicator.svelte';
	import { Button } from '$lib/Components/shadcn/button/index.js';
	import { Toggle } from '$lib/Components/shadcn/toggle/index.js';
	import { Badge } from '$lib/Components/shadcn/badge/index.js';
	import { Ban } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { accentBgStyles, defaultBgStyles, getNodeStyles } from '../NodeContentStyles.js';

	/**
	 * Props for the NodeContent component.
	 */
	type Props = {
		/** Whether the node can be toggled (for visibility). */
		isTogglable: boolean;
		/** Whether the node is enabled (downloadable). */
		isEnabled: boolean;
		/** Optional reason why the node is disabled. */
		disabledReason?: string;
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

	const {
		isTogglable,
		isEnabled,
		disabledReason,
		pressed,
		icon,
		name,
		depth,
		onclick,
		children,
		isOpen
	}: Props = $props();

	/** Calculate width to account for indentation. */
	const width = $derived(`calc(100% - (${depth} * var(--tree-step, 1.5rem)))`);

	const baseClass = getNodeStyles({ enhancedHover: true, includeFont: true });
</script>

{#if isTogglable}
	<Toggle
		{pressed}
		disabled={!isEnabled}
		class={`${baseClass} w-full h-auto py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-auto`}
		variant="outline"
		style="width: {width};"
		onPressedChange={() => {
			if (!isEnabled) return;
			onclick();
		}}
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
			{#if !isEnabled}
				<Badge
					variant="outline"
					class="w-fit px-1.5 py-0.5 text-[10px] leading-tight whitespace-nowrap"
				>
					Not available in beta
				</Badge>
			{/if}
			<div class="justify-self-end">
				{@render children?.()}
			</div>
		</div>

		{#if !isEnabled}
			<div title={disabledReason} class="pointer-events-auto">
				<Ban class="text-red-500" />
			</div>
		{/if}
	</Toggle>
{:else}
	<Button
		class={`${baseClass} w-full h-auto py-2 ${pressed ? accentBgStyles : defaultBgStyles}`}
		style="width: {width};"
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
