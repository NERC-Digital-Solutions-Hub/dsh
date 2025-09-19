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
	let isChecked = $state<boolean>(false);
	let icon = $state<string>('');

	$effect(() => {
		if (!node) {
			return;
		}

		const isVisible = getNodeVisibility ? getNodeVisibility(node.id) : undefined;
		isChecked = isVisible !== undefined ? isVisible : node.layer.visible;
		icon = getNodeIcon(node.layer, useLayerTypeIcon, isFolder, isOpen);
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
		<NodeContent {icon} name={node.name} {depth} onclick={handleFolderClick}>
			{#snippet children()}
				{#if hasVisibility}
					<Checkbox checked={isChecked} onCheckedChange={toggleVisible} />
				{/if}
			{/snippet}
		</NodeContent>

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
	<NodeContent {icon} name={node.name} {depth} onclick={handleClick}>
		{#snippet children()}
			{#if hasVisibility}
				<Checkbox checked={isChecked} onCheckedChange={toggleVisible} />
			{/if}
		{/snippet}
	</NodeContent>
{/if}
