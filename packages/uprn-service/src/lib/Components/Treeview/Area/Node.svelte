<!-- Node.svelte -->
<script lang="ts">
	import VisibilityCheckbox from '$lib/Components/VisibilityCheckbox/VisibilityCheckbox.svelte';
	import {
		DatasetTreeviewNode,
		NodeDrawState,
		VariableTreeviewNode,
		type TreeviewNode
	} from '$lib/Models/Treeview/Index.js';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/Types/Treeview.types';
	import type { Component } from 'svelte';
	import { untrack } from 'svelte';
	import type { TreeviewSearch } from '../TreeviewSearch.svelte.js';
	import { getNodeIcon } from '../GetNodeIcon';
	import NodeAnimation from '../NodeAnimation.svelte';
	import Node from './Node.svelte';
	import NodeContent from './NodeContent.svelte';

	/**
	 * Props for the Node component.
	 */
	type Props = {
		/** Configuration store for tree view settings. */
		nodeConfigProvider: INodeConfigProvider;
		/** The tree node to render. */
		node: TreeviewNode;
		/** Callback when node is clicked. */
		onNodeClick?: (node: TreeviewNode) => void;
		/** Callback when node visibility changes. */
		onNodeVisibilityChange?: (node: TreeviewNode, visible: boolean) => void;
		/** Function to get current node visibility. */
		getNodeVisibility?: (nodeId: string) => boolean | undefined;
		/** Function to get current node draw state. */
		getNodeDrawState?: (nodeId: string) => NodeDrawState;
		/** Depth level in the tree. */
		depth?: number;
		/** Whether to use layer type specific icons. */
		useLayerTypeIcon?: boolean;
		/** Optional search state for filtering and expansion control. */
		search?: TreeviewSearch | null;
	};

	/** Destructured props with defaults. */
	const {
		nodeConfigProvider,
		node,
		onNodeClick,
		onNodeVisibilityChange,
		getNodeVisibility,
		getNodeDrawState,
		depth = 0,
		useLayerTypeIcon = false,
		search = null
	}: Props = $props();

	let nodeConfig: TreeviewNodeConfig | null = $derived(
		nodeConfigProvider?.getConfig(node.id) ?? null
	);

	/** Whether this node is enabled (downloadable). */
	const isEnabled: boolean = $derived(nodeConfig?.isEnabled ?? false);

	/** Whether this node represents a folder (has children). */
	const isFolder = $derived(
		!!(
			node.children &&
			node.children.length &&
			node.children.some((child) => !isVariableNode(child))
		)
	);

	/** Whether this node has visibility controls (leaf nodes). */
	const hasVisibility = $derived(!isFolder);

	/** Reactive state for whether the folder is open. */
	let isOpen = $state(false);

	/** Reactive state for whether the node is pressed/selected. */
	let isPressed = $state<boolean>(false);

	/** Reactive state for the node's icon. */
	let icon: string | Component = $state('');

	/** Reactive state for visibility icon. */
	let showVisibility: boolean = $state(false);
	let isVisibilityAnimatingOut: boolean = $state(false);

	/** Track previous search-active state for save/restore transitions. */
	let wasSearchActive = false;

	/** Search-driven expansion: save state on activation, auto-expand ancestors, restore on clear. */
	$effect(() => {
		if (!search || !isFolder) return;

		const active = search.isActive;
		const filtering = search.isFiltering;
		const currentIsOpen = untrack(() => isOpen);

		if (active && !wasSearchActive) {
			search.saveExpansionState(node.id, currentIsOpen);
		}

		if (filtering && search.ancestorIds.has(node.id)) {
			isOpen = true;
		}

		if (!active && wasSearchActive) {
			const saved = search.getSavedExpansionState(node.id);
			if (saved !== undefined) {
				isOpen = saved;
			}
		}

		wasSearchActive = active;
	});

	// Update pressed state and icon based on node properties
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
			isPressed = isVisible !== undefined ? isVisible : false;
		}

		icon = getNodeIcon(nodeConfig?.typology ?? TreeviewNodeTypology.Area, isOpen);
	});

	$effect(() => {
		if (!isFolder) {
			showVisibility = true;
			return;
		}

		if (isPressed && !showVisibility) {
			showVisibility = true;
			isVisibilityAnimatingOut = true;
			setTimeout(() => {
				isVisibilityAnimatingOut = false;
			}, 50);
		} else if (!isPressed && showVisibility) {
			isVisibilityAnimatingOut = true;
			setTimeout(() => {
				showVisibility = false;
				isVisibilityAnimatingOut = false;
			}, 200);
		}
	});

	/**
	 * Checks if any child nodes are visible.
	 * Used to determine folder pressed state.
	 * @returns True if any child is visible.
	 */
	function hasVisibleChildren(): boolean {
		if (!node.children || !getNodeVisibility) {
			return false;
		}

		return node.children.some((child) => {
			const childVisibility = getNodeVisibility(child.id);
			return childVisibility ?? false;
		});
	}

	/**
	 * Toggles the visibility of the node.
	 * Only applicable for leaf nodes.
	 */
	function toggleVisible() {
		// Only allow toggling for leaf nodes (non-folders)
		if (!hasVisibility || !onNodeVisibilityChange || isFolder) {
			return;
		}

		isPressed = !isPressed;
		onNodeVisibilityChange(node, isPressed);
	}

	/**
	 * Handles click events on the node.
	 * For leaf nodes, toggles visibility; for folders, handled separately.
	 */
	function handleClick() {
		// Only toggle visibility for leaf nodes
		if (!isFolder) {
			toggleVisible();
		}
		onNodeClick?.(node);
	}

	/**
	 * Handles click events specifically for folder nodes.
	 * Toggles the open/closed state.
	 */
	function handleFolderClick() {
		isOpen = !isOpen;
		if (search?.isActive) {
			search.recordUserToggle(node.id);
		}
		onNodeClick?.(node);
	}

	/**
	 * Checks if a given node is a DatasetTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a DatasetTreeviewNode, false otherwise.
	 */
	function isDatasetNode(node: TreeviewNode): node is DatasetTreeviewNode {
		return node.type === TreeviewNodeType.Dataset;
	}

	/**
	 * Checks if a given node is a VariableTreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a VariableTreeviewNode, false otherwise.
	 */
	function isVariableNode(node: TreeviewNode): node is VariableTreeviewNode {
		return node.type === TreeviewNodeType.Variable;
	}
</script>

{#snippet content()}
	{#if !nodeConfig?.isHidden}
		<NodeContent
			isTogglable={!isFolder}
			{isEnabled}
			disabledReason={nodeConfig?.disabledReason}
			pressed={isPressed}
			{icon}
			name={node.name}
			{depth}
			onclick={isFolder ? handleFolderClick : handleClick}
			{isOpen}
		>
			{#snippet children()}
				{#if isPressed}
					<div class="flex items-center">
						<div class="visibility-wrapper" class:visible={!isVisibilityAnimatingOut}>
							<div class="visibility-inner">
								<VisibilityCheckbox
									disabled={true}
									checked={true}
									indeterminate={getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
								/>
							</div>
							{#if getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
								<span class="indeterminate-label text-muted-foreground">zoom</span>
							{/if}
						</div>
					</div>
				{/if}
			{/snippet}
		</NodeContent>
	{/if}
{/snippet}

{#snippet childNode(node: TreeviewNode)}
	{@const childConfig = nodeConfigProvider.getConfig(node.id)}
	{#if isDatasetNode(node) && isFolder && isOpen && !childConfig?.isHidden}
		<Node
			{nodeConfigProvider}
			{node}
			{onNodeClick}
			{onNodeVisibilityChange}
			{getNodeVisibility}
			{getNodeDrawState}
			depth={depth + 1}
			{useLayerTypeIcon}
			{search}
		/>
	{/if}
{/snippet}

<NodeAnimation
	{isOpen}
	{content}
	childNodes={isFolder
		? node.children.filter((child) => {
				if (child instanceof VariableTreeviewNode) return false;
				if (search?.isFiltering && !search.nodeOrDescendantMatches(child.id)) return false;
				return true;
			})
		: null}
	{childNode}
	animate={!search?.isActive}
/>

<style>
	.visibility-wrapper {
		position: relative;
		display: grid;
		grid-template-columns: 0fr;
		transition: grid-template-columns 0.2s ease-out;
		overflow: visible;
	}

	.visibility-wrapper.visible {
		grid-template-columns: 1fr;
	}

	.visibility-inner {
		overflow: hidden;
		display: flex;
		opacity: 0;
		transform: translateX(10px);
		transition:
			opacity 0.4s ease-out,
			transform 0.2s ease-out;
	}

	.visibility-wrapper.visible .visibility-inner {
		opacity: 1;
		transform: translateX(0);
	}

	.indeterminate-label {
		position: absolute;
		top: 90%;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.55rem;
		line-height: 1;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0.7;
		z-index: 100;
	}
</style>
