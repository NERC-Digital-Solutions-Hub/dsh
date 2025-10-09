<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import OpenIndicator from '../../../../open-indicator/open-indicator.svelte';
	import {
		baseNodeStyles,
		enhancedHoverStyles,
		fontStyles,
		defaultBgStyles,
		accentBgStyles,
		toggleSpecificStyles
	} from '../node-content-styles.js';

	type Props = {
		isTogglable: boolean;
		pressed: boolean;
		icon: string;
		name: string;
		depth: number;
		onclick: () => void;
		children?: any;
		isOpen: boolean;
	};

	const { isTogglable, pressed, icon, name, depth, onclick, children, isOpen }: Props = $props();

	const widthCalc = `calc(100% - ${depth * 1}rem)`;

	const sharedStyles = `${baseNodeStyles} ${enhancedHoverStyles}`;
	const toggleStyles = `${sharedStyles} ${toggleSpecificStyles} ${defaultBgStyles} ${fontStyles}`;
	const buttonStyles = `${sharedStyles} ${fontStyles}`;
</script>

{#if isTogglable}
	<Toggle
		{pressed}
		class={toggleStyles}
		variant="outline"
		style="width: {widthCalc};"
		onPressedChange={onclick}
	>
		<div class="flex w-full !items-center !justify-between gap-2">
			<div class="pointer-events-none !flex min-w-0 flex-1 !items-center gap-1">
				<span class="inline-block size-4" aria-hidden="true">
					{@html icon}
				</span>
				<span class="block w-full text-left break-words">{name}</span>
			</div>
			{@render children?.()}
		</div>
	</Toggle>
{:else}
	<button
		class="{buttonStyles} {pressed ? accentBgStyles : defaultBgStyles}"
		style="width: {widthCalc};"
		{onclick}
	>
		<div class="flex w-full items-center justify-between gap-2">
			<div class="pointer-events-none flex min-w-0 flex-1 items-center gap-1">
				<OpenIndicator {isOpen} />
				<span class="inline-block size-4" aria-hidden="true">
					{@html icon}
				</span>
				<span class="block w-full text-left break-words">{name}</span>
			</div>
			{@render children?.()}
		</div>
	</button>
{/if}
