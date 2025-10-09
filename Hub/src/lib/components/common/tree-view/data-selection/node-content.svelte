<script lang="ts">
	import OpenIndicator from '../../open-indicator/open-indicator.svelte';
	import { getNodeStyles } from '../node-content-styles.js';
	import type { Snippet } from 'svelte';

	type Props = {
		icon: string;
		name: string;
		depth: number;
		onclick: () => void;
		children?: Snippet;
		isGroup?: boolean;
		isOpen?: boolean;
	};

	const { icon, name, depth, onclick, children, isGroup = false, isOpen = false }: Props = $props();

	const widthCalc = `calc(100% - ${depth * 1}rem)`;
</script>

<button
	class={getNodeStyles({ enhancedHover: true, includeFont: true })}
	style="width: {widthCalc};"
	{onclick}
>
	<div class="flex w-full items-center justify-between gap-2">
		<div class="pointer-events-none flex min-w-0 flex-1 items-center gap-1">
			{#if isGroup}
				<OpenIndicator {isOpen} />
			{/if}
			<span class="inline-block size-4" aria-hidden="true">
				{@html icon}
			</span>
			<span class="block w-full text-left break-words">{name}</span>
		</div>
		{@render children?.()}
	</div>
</button>
