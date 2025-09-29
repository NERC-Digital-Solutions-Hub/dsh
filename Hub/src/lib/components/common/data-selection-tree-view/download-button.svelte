<!-- DownloadButton.svelte -->
<script lang="ts">
	import DownloadIcon from '$lib/assets/download-icon.svg?raw';
	import type { TreeNode } from './types.js';

	type Props = {
		node: TreeNode;
		onDownloadStateChanged?: (node: TreeNode, isActive: boolean) => void;
		getDownloadState?: (node: TreeNode) => boolean;
	};

	const { node, onDownloadStateChanged, getDownloadState }: Props = $props();

	let isActive = $state(getDownloadState?.(node) ?? false);

	$effect(() => {
		if (getDownloadState) {
			const externalState = getDownloadState(node);
			isActive = externalState ?? false;
		}
	});

	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		isActive = !isActive;
		onDownloadStateChanged?.(node, isActive);
	}
</script>

<button
	class="download-btn"
	class:active={isActive}
	onclick={handleClick}
	title="Download {node.name}"
	aria-label="Download {node.name}"
	aria-pressed={isActive}
>
	{@html DownloadIcon}
</button>

<style>
	.download-btn {
		/* Layout */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0.25rem;

		/* Appearance */
		background: transparent;
		border: none;
		border-radius: 0.125rem;
		cursor: pointer;

		/* Transitions */
		transition: background-color 0.1s ease-out;

		/* Focus */
		outline: none;
	}

	/* SVG styling */
	.download-btn :global(svg) {
		width: 1rem;
		height: 1rem;
		display: block;
	}

	.download-btn :global(svg path) {
		stroke: #d1d5db; /* Also set stroke for stroke-based icons */
		transition:
			fill 0.1s ease-out,
			stroke 0.1s ease-out;
	}

	/* Interactive states for inactive button */
	.download-btn:not(.active):hover {
		background-color: hsl(var(--muted));
	}

	.download-btn:not(.active):hover :global(svg path) {
		stroke: #9ca3af; /* Also set stroke for stroke-based icons */
	}

	.download-btn:not(.active):focus {
		background-color: hsl(var(--muted));
	}

	/* Active state */
	.download-btn.active :global(svg path),
	.download-btn:active :global(svg path) {
		stroke: hsl(var(--primary)); /* Also set stroke for stroke-based icons */
	}
</style>
