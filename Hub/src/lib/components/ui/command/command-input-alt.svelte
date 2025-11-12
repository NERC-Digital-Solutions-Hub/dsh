<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { CommandIcon } from 'lucide-svelte';
	import type { Component } from 'svelte';

	type Props = {
		icon?: Component;
		iconProps?: Record<string, unknown>;
		commandId?: string;
	} & CommandPrimitive.InputProps;

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(''),
		icon,
		iconProps = {},
		commandId,
		...restProps
	}: Props = $props();
</script>

<div class="flex h-9 items-center gap-2 border-b pl-2" data-slot="command-input-wrapper">
	<span
		class="flex h-full min-w-[1.25rem] shrink-0 items-center justify-center text-muted-foreground"
	>
		{#if icon}
			{@const IconComponent = icon}
			<IconComponent {...iconProps} />
		{:else}
			<CommandIcon class="size-4 opacity-50" />
		{/if}
	</span>

	{#if commandId}
		<span
			class="m-0 ml-[-5px] inline-flex max-w-[10rem] items-center overflow-hidden rounded border border-border px-1 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap text-muted-foreground"
			title={commandId}
		>
			{commandId}
		</span>
		<span aria-hidden="true" class="h-5 w-px bg-border"></span>
	{/if}

	<CommandPrimitive.Input
		data-slot="command-input"
		class={cn(
			'flex h-10 flex-1 rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		bind:ref
		{...restProps}
		bind:value
	/>
</div>
