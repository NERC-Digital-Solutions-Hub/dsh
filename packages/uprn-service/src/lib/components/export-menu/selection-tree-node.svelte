<script lang="ts" module>
	import { TreeviewNodeTypology } from '$lib/types/treeview.js';

	/**
	 * Represents a node in the selection tree.
	 */
	export type SelectionTreeviewNode = {
		/** Unique identifier for the node */
		id: string;
		/** Display name of the node */
		name: string;
		/** Whether this is a selectable leaf node */
		isLeaf: boolean;
		/** Child nodes */
		children: SelectionTreeviewNode[];
		/** Optional typology for icon display */
		typology?: TreeviewNodeTypology;
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { getNodeStyles } from '$lib/components/tree-view/node-content-styles.js';
	import { getNodeIcon } from '$lib/components/tree-view/get-node-icon.js';
	import Self from './selection-tree-node.svelte';
	import type { Snippet, Component } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type Props = {
		/** The selection tree node to render */
		node: SelectionTreeviewNode;
		/** Callback when a node's remove button is clicked */
		onRemove: (nodeId: string) => void;
		/** Optional snippet for additional actions on leaf nodes */
		actions?: Snippet<[SelectionTreeviewNode]>;
		/** Current depth for indentation */
		depth?: number;
	};

	const { node, onRemove, actions, depth = 0 }: Props = $props();

	let isOpen = $state(false);

	const isFolder = $derived(node.children.length > 0);

	/** The width to account for indentation. */
	const widthCalc = $derived(`calc(100% - ${depth * 1}rem)`);

	/** Determine the icon based on typology or folder state */
	const icon: string | Component = $derived.by(() => {
		const typology =
			node.typology ?? (isFolder ? TreeviewNodeTypology.Folder : TreeviewNodeTypology.Variable);
		return getNodeIcon(typology, isOpen);
	});

	function toggleOpen() {
		if (isFolder) {
			isOpen = !isOpen;
		}
	}

	function handleRemove(event: MouseEvent) {
		event.stopPropagation();
		onRemove(node.id);
	}
</script>

<div class="w-full">
	<Button
		class={`${getNodeStyles({ enhancedHover: true, includeFont: true })} relative w-full h-auto py-2 overflow-hidden`}
		style="width: {widthCalc};"
		onclick={toggleOpen}
	>
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
				{node.name}
			</span>

			<div class="justify-self-end flex items-center justify-end gap-2">
				{#if actions && node.isLeaf}
					{@render actions(node)}
				{/if}
				{#if node.isLeaf}
					<Button
						variant="ghost"
						size="sm"
						class="remove-btn"
						title="Remove selection"
						onclick={handleRemove}
					>
						×
					</Button>
				{/if}
			</div>
		</div>
	</Button>

	{#if isFolder && isOpen}
		<div class="relative ml-4 w-full">
			<div class="tree-guide-line"></div>
			<div
				class="tree-children"
				in:slide={{ duration: 200, easing: cubicOut }}
				out:slide={{ duration: 150 }}
			>
				{#each node.children as child (child.id)}
					<Self node={child} {onRemove} {actions} depth={depth + 1} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.remove-btn) {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		color: #6b7280;
		transition: color 0.15s ease-in-out;
	}

	:global(.remove-btn:hover) {
		color: #ef4444;
	}

	.tree-guide-line {
		position: absolute;
		left: -0.5rem;
		top: 0;
		bottom: 5px;
		width: 2px;
		background-color: var(--secondary-foreground);
		opacity: 0.5;
		z-index: 0;
	}

	.tree-children {
		position: relative;
		z-index: 1;
	}
</style>
