<!-- FilterButton.svelte -->
<script lang="ts">
	import FilterEnabledIcon from '$lib/assets/filter-enabled.svg?raw';
	import FilterDisabledIcon from '$lib/assets/filter-disabled.svg?raw';
	import type { TreeNode } from './types.js';

	type Props = {
		node: TreeNode;
		onFilterClicked?: (node: TreeNode) => void;
		hasFiltersApplied?: (node: TreeNode) => boolean;
	};

	const { node, onFilterClicked, hasFiltersApplied }: Props = $props();

	let isActive = $state(hasFiltersApplied?.(node) ?? false);

	$effect(() => {
		isActive = hasFiltersApplied?.(node) ?? false;
	});

	const iconMarkup = $derived(isActive ? FilterEnabledIcon : FilterDisabledIcon);

	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		// Optimistic UI update in case parent state updates asynchronously
		isActive = !isActive;
		onFilterClicked?.(node);
	}
</script>

<button
	class="filter-btn"
	class:active={isActive}
	onclick={handleClick}
	title={`Filter ${node.name}`}
	aria-label={`Filter ${node.name}`}
	aria-pressed={isActive}
>
	{@html iconMarkup}
</button>

<style>
	.filter-btn {
		/* Layout */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0.25rem;
		margin-right: -0.5rem;

		/* Appearance */
		background: transparent;
		border: none;
		border-radius: 0rem;
		cursor: pointer;

		/* Transitions */
		transition: background-color 0.1s ease-out;

		/* Focus */
		outline: none;
	}

	/* SVG styling */
	/* SVG styling */
	.filter-btn :global(svg) {
		width: 1rem;
		height: 1rem;
		display: block;
	}

	.filter-btn :global(svg path) {
		fill: #d1d5db; /* Default: lighter gray for disabled state */
		opacity: 0.3; /* Make disabled state more transparent */
		transition:
			fill 0.1s ease-out,
			opacity 0.1s ease-out;
	}

	/* Interactive states for inactive button */
	.filter-btn:not(.active):hover {
		background-color: hsl(var(--muted));
	}

	.filter-btn:not(.active):hover :global(svg path) {
		fill: #9ca3af; /* Medium gray on hover */
		opacity: 0.5; /* Slightly more visible on hover */
	}

	.filter-btn:not(.active):focus {
		background-color: hsl(var(--muted));
	}

	/* Active state */
	.filter-btn.active :global(svg path),
	.filter-btn:active :global(svg path) {
		fill: hsl(var(--primary));
		opacity: 1; /* Full opacity when active */
	}
</style>
