<script lang="ts" module>
	import { TreeviewNodeTypology } from '$lib/Types/Treeview.types.js';

	/**
	 * Represents a node in the selection tree.
	 */
	export type SelectionTreeviewNode = {
		/** Unique identifier for the node */
		id: string;
		/** Display name of the node */
		name: string;
		/** Whether this node is a variable */
		isVariable: boolean;
		/** Whether this is a selectable leaf node */
		isLeaf: boolean;
		/** Child nodes */
		children: SelectionTreeviewNode[];
		/** Optional typology for icon display */
		typology?: TreeviewNodeTypology;
	};
</script>

<script lang="ts">
	import OpenIndicator from '$lib/components/open-indicator/open-indicator.svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { getNodeIcon } from '$lib/components/Treeview/GetNodeIcon.js';
	import { getNodeStyles } from '$lib/components/Treeview/NodeContentStyles.js';
	import type { Component, Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { slide, type SlideParams, type TransitionConfig } from 'svelte/transition';
	import Self from './selection-tree-node.svelte';

	type Props = {
		/** The selection tree node to render */
		node: SelectionTreeviewNode;
		/** Callback when a node's remove button is clicked */
		onRemove: (node: SelectionTreeviewNode) => void;
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
		onRemove(node);
	}

	function safeSlide(node: Element, params: SlideParams = {}): TransitionConfig {
		const transition = slide(node, params);
		const css = transition.css;

		if (!css) {
			return transition;
		}

		return {
			...transition,
			css: (t, u) => {
				const computedCss = css(t, u);
				return computedCss.includes('NaN')
					? `overflow: hidden; opacity: ${t}; transform: translateX(${(1 - t) * -4}px);`
					: computedCss;
			}
		};
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
				in:safeSlide={{ duration: 200, easing: cubicOut }}
				out:safeSlide={{ duration: 150 }}
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
