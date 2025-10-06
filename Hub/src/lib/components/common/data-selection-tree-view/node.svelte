<!-- Node.svelte -->
<script lang="ts">
	import VisibilityCheckbox from '$lib/components/common/visibility-checkbox/visibility-checkbox.svelte';
	import Node from './node.svelte';
	import NodeContent from './node-content.svelte';
	import DownloadButton from './download-button.svelte';
	import FilterButton from './filter-button.svelte';
	import { getNodeIcon } from './get-node-icon';
	import type { TreeNode } from './types.js';
	import type { TreeviewConfig } from '$lib/utils/app-config-provider.js';

	type Props = {
		treeviewConfig?: TreeviewConfig | null;
		node: TreeNode;
		isDownloadable?: boolean;
		onNodeClick?: (node: TreeNode) => void;
		onNodeVisibilityChange?: (node: TreeNode, visible: boolean) => void;
		onDownloadStateChanged?: (node: TreeNode, isActive: boolean) => void;
		getDownloadState?: (node: TreeNode) => boolean;
		onFilterClicked?: (layerId: string) => void;
		hasFiltersApplied?: (layerId: string) => boolean;
		getNodeVisibility?: (nodeId: string) => boolean | undefined;
		depth?: number;
		useLayerTypeIcon?: boolean; // Use ArcGIS layer type specific icons
	};

	const {
		treeviewConfig = null,
		node,
		isDownloadable,
		onNodeClick,
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		onFilterClicked,
		hasFiltersApplied,
		getNodeVisibility,
		depth = 0,
		useLayerTypeIcon = false
	}: Props = $props();

	// Calculate width reduction to match ml-4 indentation (1rem per level)
	// Each child is indented by ml-4 (1rem) and should be 1rem narrower

	const isFolder = !!(node.children && node.children.length);
	const hasVisibility = !!node.layer && 'visible' in node.layer && !isFolder;

	let isOpen = $state(false);
	let isChecked = $state<boolean>(false);
	let icon = $state<string>('');
	let showFilter = $state(false);
	let isAnimatingOut = $state(false);

	$effect(() => {
		if (!node) {
			return;
		}

		const isVisible = getNodeVisibility ? getNodeVisibility(node.id) : undefined;
		isChecked = isVisible !== undefined ? isVisible : node.layer.visible;
		icon = getNodeIcon(node.layer, useLayerTypeIcon, isFolder, isOpen);
	});

	// Handle filter visibility changes with animation
	$effect(() => {
		const shouldShow = (getDownloadState?.(node) && node.layer.type === 'feature') ?? false;

		if (shouldShow && !showFilter) {
			// Show immediately
			showFilter = true;
			isAnimatingOut = false;
		} else if (!shouldShow && showFilter) {
			// Start fade out animation
			isAnimatingOut = true;
			// Remove after animation completes
			setTimeout(() => {
				showFilter = false;
				isAnimatingOut = false;
			}, 180);
		}
	});

	function toggleVisible() {
		if (!hasVisibility || !onNodeVisibilityChange) {
			return;
		}

		isChecked = !isChecked;
		onNodeVisibilityChange(node, isChecked);
	}

	function handleClick() {
		onNodeClick?.(node);
	}

	function handleFolderClick() {
		isOpen = !isOpen;
		onNodeClick?.(node);
	}
</script>

{#if isFolder}
	<div class="w-full">
		<!-- Parent folder with its own border - entire area clickable -->
		<NodeContent
			{icon}
			name={node.name}
			{depth}
			onclick={handleFolderClick}
			isGroup={true}
			{isOpen}
		>
			{#snippet children()}
				<div class="flex items-center gap-2">
					{#if hasVisibility}
						<VisibilityCheckbox checked={isChecked} onCheckedChange={toggleVisible} />
					{/if}
				</div>
			{/snippet}
		</NodeContent>

		<!-- Children nodes outside parent border - only show when open -->
		{#if isOpen}
			<div class="tree-children relative ml-4 w-full">
				<!-- Vertical guide line with grow animation -->
				<div class="tree-guide-line tree-guide-line-animate"></div>
				{#each node.children ?? [] as child, index (child.id)}
					<div class="tree-node-item" style="animation-delay: {100 + index * 50}ms;">
						<Node
							node={child}
							isDownloadable={treeviewConfig?.layers.find((cfg) => cfg.name === child.name)
								?.isDownloadable ?? true}
							{onNodeClick}
							{onNodeVisibilityChange}
							{onDownloadStateChanged}
							{getDownloadState}
							{onFilterClicked}
							{hasFiltersApplied}
							{getNodeVisibility}
							depth={depth + 1}
							{useLayerTypeIcon}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<NodeContent {icon} name={node.name} {depth} onclick={handleClick} isGroup={false}>
		{#snippet children()}
			<div class="flex items-center gap-2">
				{#if isDownloadable}
					{#if showFilter}
						<div
							class="filter-transition-wrapper"
							class:fade-in={!isAnimatingOut}
							class:fade-out={isAnimatingOut}
						>
							<FilterButton layerId={node.id} {onFilterClicked} {hasFiltersApplied} />
						</div>
					{/if}
					<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
				{/if}
				{#if hasVisibility}
					<VisibilityCheckbox checked={isChecked} onCheckedChange={toggleVisible} />
				{/if}
			</div>
		{/snippet}
	</NodeContent>
{/if}

<style>
	.filter-transition-wrapper {
		display: inline-block;
	}

	.filter-transition-wrapper.fade-in {
		animation: slideInFade 0.2s ease-out;
	}

	.filter-transition-wrapper.fade-out {
		animation: slideOutFade 0.2s ease-out;
	}

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
		opacity: 0.3;
		transform: scaleY(0);
		transform-origin: top;
		will-change: transform;
		animation: lineGrow 300ms ease-out forwards;
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

	@keyframes slideInFade {
		from {
			opacity: 0;
			transform: translateX(10px) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	@keyframes slideOutFade {
		from {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
		to {
			opacity: 0;
			transform: translateX(10px) scale(0.8);
		}
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
