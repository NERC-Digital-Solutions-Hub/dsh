<!-- Node.svelte -->
<script lang="ts">
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { getNodeIcon } from '../get-node-icon';
	import NodeAnimation from '../node-animation.svelte';
	import {
		LayerDrawState,
		VariableTreeviewNode,
		LayerTreeviewNode,
		type TreeviewNode
	} from '$lib/models/treeview/index.js';
	import NodeContent from './node-content.svelte';
	import Node from './node.svelte';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/types/treeview';
	import type { Component } from 'svelte';
	import VisibilityCheckbox from '$lib/components/visibility-checkbox/visibility-checkbox.svelte';

	/**
	 * Props for the Node component.
	 */
	type Props = {
		/** Configuration store for tree view settings. */
		treeviewConfigStore: TreeviewConfigStore;
		/** The tree node to render. */
		node: TreeviewNode;
		/** Callback when node is clicked. */
		onNodeClick?: (node: TreeviewNode) => void;
		/** Callback when node visibility changes. */
		onNodeVisibilityChange?: (node: TreeviewNode, visible: boolean) => void;
		/** Function to get current node visibility. */
		getNodeVisibility?: (nodeId: string) => boolean | undefined;
		/** Function to get current node draw state. */
		getNodeDrawState?: (nodeId: string) => LayerDrawState;
		/** Depth level in the tree. */
		depth?: number;
		/** Whether to use layer type specific icons. */
		useLayerTypeIcon?: boolean;
	};

	/** Destructured props with defaults. */
	const {
		treeviewConfigStore,
		node,
		onNodeClick,
		onNodeVisibilityChange,
		getNodeVisibility,
		getNodeDrawState,
		depth = 0,
		useLayerTypeIcon = false
	}: Props = $props();

	let nodeConfig: TreeviewNodeConfig | null = $derived(
		treeviewConfigStore?.getConfig(node.id) ?? null
	);

	/** Whether this node represents a folder (has children). */
	const isFolder = $derived(
		!!(
			node.children &&
			node.children.length &&
			node.children.some((child) => !(child instanceof VariableTreeviewNode))
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
			return childVisibility !== undefined
				? childVisibility
				: child instanceof LayerTreeviewNode
					? child.layer.visible
					: false;
		});
	}

	// Update pressed state and icon based on node properties
	$effect(() => {
		if (!node || !(node instanceof LayerTreeviewNode)) {
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
		onNodeClick?.(node);
	}
</script>

{#snippet content()}
	{#if !treeviewConfigStore.getConfig(node.id)?.isHidden}
		{#if isFolder}
			<NodeContent
				isTogglable={false}
				pressed={isPressed}
				{icon}
				name={node.name}
				{depth}
				onclick={handleFolderClick}
				{isOpen}
			/>
		{:else}
			<NodeContent
				isTogglable={true}
				pressed={isPressed}
				{icon}
				name={node.name}
				{depth}
				onclick={handleClick}
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
										indeterminate={getNodeDrawState?.(node.id) === LayerDrawState.Suspended}
									/>
								</div>
							</div>
						</div>
					{/if}
				{/snippet}
			</NodeContent>
		{/if}
	{/if}
{/snippet}

{#snippet childNode(node: TreeviewNode)}
	{@const childConfig = treeviewConfigStore.getConfig(node.id)}
	{#if isFolder && isOpen && !childConfig?.isHidden}
		<Node
			{treeviewConfigStore}
			{node}
			{onNodeClick}
			{onNodeVisibilityChange}
			{getNodeVisibility}
			{getNodeDrawState}
			depth={depth + 1}
			{useLayerTypeIcon}
		/>
	{/if}
{/snippet}

<NodeAnimation
	{isOpen}
	{content}
	childNodes={isFolder
		? node.children.filter((child) => !(child instanceof VariableTreeviewNode))
		: null}
	{childNode}
/>

<style>
	.visibility-wrapper {
		display: grid;
		grid-template-columns: 0fr;
		transition: grid-template-columns 0.2s ease-out;
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
</style>
