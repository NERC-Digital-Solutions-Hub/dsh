<script lang="ts">
	import type { TreeNode } from './types.js';
	import { type Snippet } from 'svelte';

	/**
	 * Props for the NodeAnimation component.
	 */
	type Props = {
		/** Whether the node is currently open (expanded). */
		isOpen?: boolean;
		/** The child nodes to render when expanded. */
		childNodes?: TreeNode[] | null;
		/** The content snippet to render for the node. */
		content?: Snippet;
		/** The snippet to render for each child node. */
		childNode?: Snippet<[TreeNode]>;
	};

	/** Destructured props with defaults. */
	const { isOpen = false, childNodes = null, content, childNode }: Props = $props();
</script>

<div class="w-full">
	<!-- Render the main node content -->
	{@render content?.()}

	<!-- Children container with animations and depth lines -->
	<!-- Children nodes outside parent border - only show when open -->
	{#if isOpen && childNodes}
		<div class="tree-children relative ml-4 w-full">
			<!-- Vertical guide line with grow animation -->
			<div class="tree-guide-line tree-guide-line-animate"></div>
			{#each childNodes ?? [] as child, index (child.id)}
				<div class="tree-node-item" style="animation-delay: {100 + index * 50}ms;">
					{@render childNode?.(child)}
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
	.tree-children {
		animation: containerFadeIn 200ms ease-out;
	}

	/* Individual node animation */
	.tree-node-item {
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
