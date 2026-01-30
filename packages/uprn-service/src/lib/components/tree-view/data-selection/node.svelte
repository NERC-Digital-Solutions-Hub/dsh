<!-- Node.svelte -->
<script lang="ts">
	import NodeAnimation from '$lib/components/tree-view/node-animation.svelte';
	import VisibilityCheckbox from '$lib/components/visibility-checkbox/visibility-checkbox.svelte';
	import type { TreeviewConfigStore } from '$lib/stores/treeview-config-store';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/types/treeview.js';
	import { getNodeIcon } from '../get-node-icon';
	import {
		LayerDrawState,
		SelectionState,
		TreeLayerNode,
		type TreeNode
	} from '$lib/models/treeview/index.js';
	import { getTreeEvents } from '$lib/events/data-treeview-events';
	import DownloadButton from './download-button.svelte';
	import NodeContent from './node-content.svelte';
	import Node from './node.svelte';
	import InfoButton from '$lib/components/tree-view/data-selection/info-button.svelte';
	import type { Component } from 'svelte';
	/**
	 * Props for the Node component.
	 */
	type Props = {
		/** Configuration store for tree view settings. */
		treeviewConfigStore?: TreeviewConfigStore | null;
		/** The tree node to render. */
		node: TreeNode;
		/** Whether the node is downloadable. */
		isDownloadable?: boolean;
		/** Depth level in the tree. */
		depth?: number;
		/** Whether to use layer type specific icons. */
		useLayerTypeIcon?: boolean;
	};

	/** Destructured props with defaults. */
	const {
		treeviewConfigStore = null,
		node,
		isDownloadable,
		depth = 0,
		useLayerTypeIcon = false
	}: Props = $props();

	/** Retrieve tree event callbacks */
	const {
		onNodeClick,
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		getNodeVisibility,
		getNodeDrawState
	} = getTreeEvents();

	let isInitialised = false;

	/** Reactive state for whether the folder is open. */
	let isOpen: boolean = $state(false);

	/** Reactive state for whether the node is checked/visible. */
	let isChecked: boolean = $state(false);

	let nodeConfig: TreeviewNodeConfig | null = $derived(
		treeviewConfigStore?.getItemConfig(node.id) ?? null
	);

	/** Whether this node represents a folder (has children). */
	const isFolder: boolean = $derived(!!(node.children && node.children.length));

	/** Whether this node has visibility controls. */
	const hasVisibility: boolean = $derived(!isFolder || isChecked);

	/** Reactive state for the node's icon. */
	let icon: string | Component = $state('');

	/** Reactive state for whether filter button should be shown. */
	let showFilter: boolean = $state(false);

	/** Reactive state for filter animation. */
	let isAnimatingOut: boolean = $state(false);

	/** Reactive state for visibility icon. */
	let showVisibility: boolean = $state(false);
	let isVisibilityAnimatingOut: boolean = $state(false);

	$effect(() => {
		if (!isFolder) {
			showVisibility = true;
			return;
		}

		if (isChecked && !showVisibility) {
			showVisibility = true;
			isVisibilityAnimatingOut = true;
			setTimeout(() => {
				isVisibilityAnimatingOut = false;
			}, 50);
		} else if (!isChecked && showVisibility) {
			isVisibilityAnimatingOut = true;
			setTimeout(() => {
				showVisibility = false;
				isVisibilityAnimatingOut = false;
			}, 200);
		}
	});

	$effect(() => {
		if (isInitialised) {
			return;
		}

		isOpen = nodeConfig?.isOpenOnInit ?? false;
		isInitialised = true;
	});

	// Update checked state and icon based on node properties
	$effect(() => {
		if (!node) {
			return;
		}

		const isVisible = getNodeVisibility ? getNodeVisibility(node.id) : false;
		isChecked = isVisible ?? false;
		// if (!(node instanceof TreeLayerNode)) {
		// 	return;
		// }

		icon = getNodeIcon(
			nodeConfig?.typology ?? TreeviewNodeTypology.Variable,
			isOpen
		);
	});

	// Handle filter visibility changes with animation
	$effect(() => {
		if (!(node instanceof TreeLayerNode)) {
			return;
		}

		const shouldShow =
			(getDownloadState?.(node) === SelectionState.Active && node.layer.type === 'feature') ??
			false;

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

	/**
	 * Toggles the visibility of the node.
	 * Only applicable for leaf nodes with visibility controls.
	 */
	function toggleVisible() {
		if (!hasVisibility || !onNodeVisibilityChange) {
			return;
		}

		isChecked = !isChecked;
		onNodeVisibilityChange(node, isChecked);
	}

	/**
	 * Handles click events on the node.
	 * Calls the node click callback.
	 */
	function handleClick() {
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
	{#if !nodeConfig?.isHidden}
		{#if isFolder}
			<NodeContent {icon} name={node.name} {depth} onclick={handleFolderClick} {isFolder} {isOpen}>
				{#snippet children()}
					<div class="flex items-center">
						{#if isDownloadable}
							<div class="mr-2">
								<InfoButton layerId={node.id} />
							</div>
							<div class="mr-2">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</div>
						{/if}
						{#if showVisibility}
							<div class="visibility-wrapper" class:visible={!isVisibilityAnimatingOut}>
								<div class="visibility-inner">
									<VisibilityCheckbox
										checked={isChecked}
										indeterminate={getNodeDrawState?.(node.id) === LayerDrawState.Suspended}
										onCheckedChange={toggleVisible}
									/>
								</div>
							</div>
						{/if}
					</div>
				{/snippet}
			</NodeContent>
		{:else}
			<NodeContent {icon} name={node.name} {depth} onclick={handleClick} {isFolder}>
				{#snippet children()}
					<div class="flex items-center">
						{#if isDownloadable}
							<div class="mr-2">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</div>
						{/if}
						{#if hasVisibility}
							<VisibilityCheckbox
								checked={isChecked}
								indeterminate={getNodeDrawState?.(node.id) === LayerDrawState.Suspended}
								onCheckedChange={toggleVisible}
							/>
						{/if}
					</div>
				{/snippet}
			</NodeContent>
		{/if}
	{/if}
{/snippet}

{#snippet childNode(node: TreeNode)}
	{#if isFolder && isOpen && !nodeConfig?.isHidden}
		<Node
			{treeviewConfigStore}
			{node}
			isDownloadable={nodeConfig?.isDownloadable ?? true}
			depth={depth + 1}
			{useLayerTypeIcon}
		/>
	{/if}
{/snippet}

<NodeAnimation {isOpen} {content} childNodes={isFolder ? node.children : null} {childNode} />

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
