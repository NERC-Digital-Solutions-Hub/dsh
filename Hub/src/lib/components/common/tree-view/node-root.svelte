<!-- NodeRoot.svelte - Unified root component for tree nodes -->
<script lang="ts">
	import type { TreeNode } from '../data-selection-tree-view/types.js';
	import { type Snippet } from 'svelte';

	type Props = {
		node: TreeNode;
		depth?: number;
		isOpen?: boolean;
		isGroup?: boolean;
		children?: Snippet; // The node content itself
		childNode?: Snippet<[TreeNode, number, number]>; // Snippet for rendering child nodes
		// Animation control
		enableAnimation?: boolean;
		// Depth line control
		showDepthLine?: boolean;
	};
	const {
		node,
		depth = 0,
		isOpen = false,
		isGroup = false,
		children,
		childNode,
		enableAnimation = true,
		showDepthLine = true
	}: Props = $props();

	// Check if this node has children to show
	const hasChildren = !!(node.children && node.children.length > 0);
	const shouldShowChildren = isGroup && isOpen && hasChildren;
</script>

<div class="w-full">
	<!-- Node content -->
	{@render children?.()}

	<!-- Children container with animations and depth lines -->
	{#if shouldShowChildren}
		<div class="tree-children relative ml-4 w-full" class:animate={enableAnimation}>
			<!-- Vertical guide line with animation -->
			{#if showDepthLine}
				<div class="tree-guide-line" class:tree-guide-line-animate={enableAnimation}></div>
			{/if}

			<!-- Child nodes with staggered animation -->
			{#each node.children ?? [] as child, index (child.id)}
				<div
					class="tree-node-item"
					class:animate={enableAnimation}
					style="animation-delay: {enableAnimation ? 100 + index * 50 : 0}ms;"
				>
					{@render childNode?.(child, index, depth + 1)}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Tree guide line for showing depth levels */
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

	/* Animation for line growing when group opens */
	.tree-guide-line-animate {
		background-color: transparent;
	}

	.tree-guide-line-animate::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 2px;
		height: 100%;
		background-color: var(--secondary-foreground);
		opacity: 0.5;
		transform: scaleY(0);
		transform-origin: top;
		will-change: transform;
		animation: lineGrow 300ms ease-out forwards;
		/* Force exact pixel rendering */
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	/* Container for animated children */
	.tree-children.animate {
		animation: containerFadeIn 200ms ease-out;
	}

	/* Individual node animation */
	.tree-node-item.animate {
		animation: nodeSlideIn 250ms ease-out both;
		transform-origin: left center;
	}

	@keyframes lineGrow {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	@keyframes containerFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes nodeSlideIn {
		from {
			opacity: 0;
			transform: translateX(-10px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}
</style>
