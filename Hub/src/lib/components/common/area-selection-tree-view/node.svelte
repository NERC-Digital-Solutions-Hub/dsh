<!-- Node.svelte -->
<script lang="ts">
	import { Checkbox } from '$lib/components/ui/no-prop-checkbox/index';
	import Node from './node.svelte';
	import NodeContent from './node-content.svelte';
	import { getNodeIcon } from './get-node-icon';
	import type { TreeNode } from './types.js';

	type Props = {
		node: TreeNode;
		onNodeClick?: (node: TreeNode) => void;
		onNodeVisibilityChange?: (node: TreeNode, visible: boolean) => void;
		getNodeVisibility?: (nodeId: string) => boolean | undefined;
		depth?: number;
		useLayerTypeIcon?: boolean; // Use ArcGIS layer type specific icons
	};

	const {
		node,
		onNodeClick,
		onNodeVisibilityChange,
		getNodeVisibility,
		depth = 0,
		useLayerTypeIcon = false
	}: Props = $props();

	// Calculate width reduction to match ml-4 indentation (1rem per level)
	// Each child is indented by ml-4 (1rem) and should be 1rem narrower

	const hasVisibility = !!node.layer && 'visible' in node.layer;
	const isFolder = !!(node.children && node.children.length);

	let isOpen = $state(false);
	let isPressed = $state<boolean>(false);
	let icon = $state<string>('');

	// Function to check if any child nodes are visible
	function hasVisibleChildren(): boolean {
		if (!node.children || !getNodeVisibility) {
			return false;
		}

		return node.children.some((child) => {
			const childVisibility = getNodeVisibility(child.id);
			return childVisibility !== undefined ? childVisibility : child.layer.visible;
		});
	}

	$effect(() => {
		if (!node) {
			return;
		}

		if (isFolder) {
			// For folders, pressed state depends on children visibility
			isPressed = hasVisibleChildren();
		} else {
			// For leaf nodes, use their own visibility
			const isVisible = getNodeVisibility ? getNodeVisibility(node.id) : undefined;
			isPressed = isVisible !== undefined ? isVisible : node.layer.visible;
		}

		icon = getNodeIcon(node.layer, useLayerTypeIcon, isFolder, isOpen);
	});

	function toggleVisible() {
		// Only allow toggling for leaf nodes (non-folders)
		if (!hasVisibility || !onNodeVisibilityChange || isFolder) {
			return;
		}

		isPressed = !isPressed;
		onNodeVisibilityChange(node, isPressed);
	}

	function handleClick() {
		// Only toggle visibility for leaf nodes
		if (!isFolder) {
			toggleVisible();
		}
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
			isTogglable={false}
			pressed={isPressed}
			{icon}
			name={node.name}
			{depth}
			onclick={handleFolderClick}
			{isOpen}
		/>

		<!-- Children nodes outside parent border - only show when open -->
		{#if isOpen}
			<div class="ml-4 w-full">
				{#each node.children ?? [] as child (child.id)}
					<Node
						node={child}
						{onNodeClick}
						{onNodeVisibilityChange}
						{getNodeVisibility}
						depth={depth + 1}
						{useLayerTypeIcon}
					/>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<NodeContent
		isTogglable={true}
		pressed={isPressed}
		{icon}
		name={node.name}
		{depth}
		onclick={handleClick}
		{isOpen}
	/>
{/if}
