<script lang="ts">
	import SelectionTreeviewNode from '$lib/components/export-menu/selection-treeview-node.svelte';
	import type { SelectionSummaryNode } from '$lib/types/selection-summary.types';
	import { cn } from '$lib/utils';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	type Props = {
		class?: string;
		kind: 'area' | 'data';
		title: string;
		countLabel?: string;
		nodes: SelectionSummaryNode[];
		emptyText: string;
		onRemove?: (node: SelectionSummaryNode) => void;
	};

	const { class: className, kind, title, countLabel, nodes, emptyText, onRemove }: Props = $props();
</script>

<section class={cn('space-y-2', className)}>
	<div class="flex items-baseline justify-between gap-3 pb-0.5">
		<div class="ml-2 flex items-center gap-2">
			{#if kind === 'area'}
				<MapPinIcon size={16} class="text-muted-foreground" />
			{:else}
				<DatabaseIcon size={16} class="text-muted-foreground" />
			{/if}
			<h4 class="text-sm font-semibold text-foreground">{title}</h4>
		</div>
		{#if countLabel}
			<p class="mr-2 text-xs text-muted-foreground">{countLabel}</p>
		{/if}
	</div>

	{#if nodes.length > 0}
		<div class="space-y-1">
			{#each nodes as node (node.id)}
				<SelectionTreeviewNode {node} {onRemove} />
			{/each}
		</div>
	{:else}
		<p class="text-sm italic text-muted-foreground">{emptyText}</p>
	{/if}
</section>
