<script lang="ts">
	import * as ContextMenu from '$lib/components/shadcn/context-menu';

	import type { Component } from 'svelte';

	export type UprnMapContextMenuActionEntry = {
		action: () => void;
		disabled?: boolean;
		icon?: Component;
		kind: 'action';
		label: string;
	};

	export type UprnMapContextMenuSeparatorEntry = {
		kind: 'separator';
	};

	export type UprnMapContextMenuEntry =
		| UprnMapContextMenuActionEntry
		| UprnMapContextMenuSeparatorEntry;

	export type UprnMapContextMenuEntries = Record<string, UprnMapContextMenuEntry>;

	/**
	 * Renders the right-click actions for the ArcGIS map.
	 *
	 * The parent owns positioning through the shadcn context-menu trigger. This component
	 * only reads the supplied entry object and renders intrinsic menu content.
	 */
	type Props = {
		entries: UprnMapContextMenuEntries;
	};

	const { entries }: Props = $props();
</script>

<ContextMenu.Content class="min-w-48">
	{#each Object.entries(entries) as [id, entry] (id)}
		{#if entry.kind === 'separator'}
			<ContextMenu.Separator />
		{:else}
			<ContextMenu.Item
				disabled={entry.disabled}
				textValue={entry.label}
				onSelect={() => entry.action()}
			>
				{#if entry.icon}
					{@const Icon = entry.icon}
					<Icon class="size-4" />
				{/if}
				<span>{entry.label}</span>
			</ContextMenu.Item>
		{/if}
	{/each}
</ContextMenu.Content>
