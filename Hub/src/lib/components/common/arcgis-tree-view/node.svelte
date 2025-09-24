<!-- Node.svelte -->
<script lang="ts">
	import { Checkbox } from '$lib/components/ui/no-prop-checkbox/index';
	import Node from './node.svelte';
	import NodeContent from './node-content.svelte';
	import DownloadButton from './download-button.svelte';
	import { getNodeIcon } from './get-node-icon';
	import type { TreeNode } from './types.js';
	import type { TreeviewConfig } from '$lib/utils/app-config-provider.js';

	type Props = {
		treeviewConfig?: TreeviewConfig[] | null;
		node: TreeNode;
		isDownloadable?: boolean;
		onNodeClick?: (node: TreeNode) => void;
		onNodeVisibilityChange?: (node: TreeNode, visible: boolean) => void;
		onDownloadStateChanged?: (node: TreeNode, isActive: boolean) => void;
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
				<div class="flex items-center gap-2">
					{#if hasVisibility}
						<Checkbox checked={isChecked} onCheckedChange={toggleVisible} />
					{/if}
				</div>
			{/snippet}
		</NodeContent>

		<!-- Children nodes outside parent border - only show when open -->
		{#if isOpen}
			<div class="ml-4 w-full">
				{#each node.children ?? [] as child (child.id)}
					<Node
						node={child}
						isDownloadable={treeviewConfig?.find((cfg) => cfg.name === child.name)
							?.isDownloadable ?? true}
						{onNodeClick}
						{onNodeVisibilityChange}
						{onDownloadStateChanged}
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
			<div class="flex items-center gap-2">
				{#if isDownloadable}
					<DownloadButton {node} {onDownloadStateChanged} />
				{/if}
				{#if hasVisibility}
					<Checkbox checked={isChecked} onCheckedChange={toggleVisible} />
				{/if}
			</div>
		{/snippet}
	</NodeContent>
{/if}
