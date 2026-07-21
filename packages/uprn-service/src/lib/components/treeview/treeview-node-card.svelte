<script lang="ts">
	import { Ban } from '@lucide/svelte';

	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { cn } from '$lib/utils';

	import TreeviewNodeIcon from './treeview-node-icon.svelte';

	import type { Component, Snippet } from 'svelte';

	/**
	 * Shared visual shell for virtualized treeview rows.
	 *
	 * The parent owns list placement and click behavior through BaseTreeview. This component
	 * owns the row's intrinsic card presentation, icon slots, disabled marker, and actions area.
	 */
	type Props = {
		actions?: Snippet;
		class?: string;
		disabled?: boolean;
		disabledReason?: string;
		hasChildren: boolean;
		icon: string | Component;
		isOpen?: boolean;
		isPressed?: boolean;
		name: string;
		stopActionClickPropagation?: boolean;
	};

	const {
		actions,
		class: className,
		disabled = false,
		disabledReason,
		hasChildren,
		icon,
		isOpen = false,
		isPressed = false,
		name,
		stopActionClickPropagation = false
	}: Props = $props();
</script>

<div
	class={cn(
		'node-card relative overflow-hidden rounded-md',
		isPressed && 'node-card-accent',
		disabled && 'node-card-disabled',
		className
	)}
>
	<div class="node-grid">
		<div class="node-icons">
			{#if hasChildren}
				<span class="icon-slot">
					<OpenIndicator {isOpen} />
				</span>
			{/if}
			<TreeviewNodeIcon {icon} />
		</div>

		<span class="node-name">{name}</span>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="node-end"
			onclick={(event) => {
				if (stopActionClickPropagation) {
					event.stopPropagation();
				}
			}}
		>
			{@render actions?.()}

			{#if disabled}
				<span title={disabledReason}>
					<Ban class="size-4 text-red-500" />
				</span>
			{/if}
		</div>
	</div>

	{#if disabled}
		<span class="beta-badge pointer-events-none absolute top-1/2 right-8 z-10">
			<Badge
				variant="outline"
				class="w-fit border-pink-400 bg-pink-100 px-1.5 py-0.5 text-[10px] leading-tight whitespace-nowrap opacity-100"
			>
				Not available in beta
			</Badge>
		</span>
	{/if}
</div>
