<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle/index.js';

	type Props = {
		isTogglable: boolean;
		pressed: boolean;
		icon: string;
		name: string;
		depth: number;
		onclick: () => void;
		children?: any;
	};

	const { isTogglable, pressed, icon, name, depth, onclick, children }: Props = $props();

	const widthCalc = `calc(100% - ${depth * 1}rem)`;
</script>

{#if isTogglable}
	<Toggle
		{pressed}
		class="mb-1 !h-auto !min-h-9 cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left !whitespace-normal transition-colors hover:bg-card/70 data-[state=on]:!bg-accent data-[state=on]:!text-accent-foreground data-[state=on]:hover:!bg-accent data-[state=on]:hover:!text-accent-foreground"
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
		class="mb-1 cursor-pointer rounded-md border border-border/30 p-2 text-left text-sm font-medium transition-colors hover:bg-card/70 {pressed
			? 'bg-accent text-accent-foreground'
			: 'bg-card/50'}"
		style="width: {widthCalc};"
		{onclick}
	>
		<div class="flex w-full items-center justify-between gap-2">
			<div class="pointer-events-none flex min-w-0 flex-1 items-center gap-1">
				<span class="inline-block size-4" aria-hidden="true">
					{@html icon}
				</span>
				<span class="block w-full text-left break-words">{name}</span>
			</div>
			{@render children?.()}
		</div>
	</button>
{/if}
