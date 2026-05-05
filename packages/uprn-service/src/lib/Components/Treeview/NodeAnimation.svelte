<script lang="ts">
	import { TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import { type Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { slide, type SlideParams, type TransitionConfig } from 'svelte/transition';

	/**
	 * Props for the NodeAnimation component.
	 */
	type Props = {
		/** Whether the node is currently open (expanded). */
		isOpen?: boolean;
		/** The child nodes to render when expanded. */
		childNodes?: TreeviewNode[] | null;
		/** The content snippet to render for the node. */
		content?: Snippet;
		/** The snippet to render for each child node. */
		childNode?: Snippet<[TreeviewNode]>;
		/** Optional animation duration in milliseconds. */
		duration?: number;
		/** Whether to animate open/close transitions. Set false to skip (e.g. during search). */
		animate?: boolean;
	};

	/** Destructured props with defaults. */
	const {
		isOpen = false,
		childNodes = null,
		content,
		childNode,
		duration = 300,
		animate = true
	}: Props = $props();

	/** Resolved duration — 0 when animations are suppressed. */
	const effectiveDuration = $derived(animate ? duration : 0);

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

<div class="w-full" style="--tree-step: 1.5rem;">
	<!-- Render the main node content (label, toggle, etc.) -->
	{@render content?.()}

	<!-- Children -->
	{#if isOpen && childNodes}
		<div class="relative w-full children-wrap" style="margin-left: var(--tree-step, 1.5rem);">
			<div class="tree-guide-line"></div>

			<div
				class="tree-children"
				in:safeSlide={{ duration: effectiveDuration, easing: cubicOut }}
				out:safeSlide={{ duration: effectiveDuration }}
			>
				{#each childNodes ?? [] as child (child.id)}
					{@render childNode?.(child)}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
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
			transform: translateX(-10px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}
</style>
