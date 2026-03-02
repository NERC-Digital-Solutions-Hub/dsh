<!-- Node.svelte -->
<script lang="ts">
	import InfoButton from '$lib/Components/Treeview/Data/InfoButton.svelte';
	import Node from '$lib/Components/Treeview/Data/Node.svelte';
	import NodeContent from '$lib/Components/Treeview/Data/NodeContent.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon';
	import NodeAnimation from '$lib/Components/Treeview/NodeAnimation.svelte';
	import VisibilityCheckbox from '$lib/Components/VisibilityCheckbox/VisibilityCheckbox.svelte';
	import { getTreeEvents } from '$lib/Events/DataTreeviewEvents';
	import { NodeDrawState, TreeviewNode } from '$lib/Models/Treeview/Index.js';
	import { TreeviewNodeType } from '$lib/Models/Treeview/TreeviewNodeType';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { INodeTagProvider } from '$lib/Services/INodeTagProvider';
	import type { ITagDefinitionProvider } from '$lib/Services/ITagDefinitionProvider';
	import type { TagDefinition } from '$lib/Types/Configuration.types.js';
	import { TreeviewNodeTypology, type TreeviewNodeConfig } from '$lib/Types/Treeview.types.js';
	import type { Component } from 'svelte';
	import DownloadButton from './DownloadButton.svelte';

	/**
	 * Props for the Node component.
	 */
	type Props = {
		/** The tree node to render. */
		node: TreeviewNode;

		/** Depth level in the tree. */
		depth: number;

		/** Configuration store for tree view settings. */
		nodeConfigProvider: INodeConfigProvider;

		/** Optional tag provider for node tags. */
		nodeTagProvider: INodeTagProvider;

		/** Optional tag definition provider. */
		tagDefinitionProvider: ITagDefinitionProvider;

		/** The IDs of currently selected tags to filter by. */
		selectedTagIds: Set<string>;
	};

	const {
		node,
		depth = 0,
		nodeConfigProvider,
		nodeTagProvider,
		tagDefinitionProvider,
		selectedTagIds = new Set<string>()
	}: Props = $props();

	const {
		onNodeClick,
		onNodeVisibilityChange,
		onDownloadStateChanged,
		getDownloadState,
		getNodeVisibility,
		getNodeDrawState
	} = getTreeEvents();

	/** Flag to track if the component has been initialised. */
	let isInitialised = false;

	/** Reactive state for whether the folder is open. */
	let isOpen: boolean = $state(false);

	/** Reactive state for whether the node is checked/visible. */
	let isChecked: boolean = $state(false);

	/** Reactive state for node configuration. */
	let nodeConfig: TreeviewNodeConfig | null = $derived(
		nodeConfigProvider?.getConfig(node.id) ?? null
	);

	/** Reactive state for whether the node is downloadable. */
	let isDownloadable: boolean = $derived(nodeConfig?.isEnabled ?? true);

	/** Reactive state for node tag definitions. */
	const nodeTagDefinitions: TagDefinition[] = $derived.by(() => {
		if (!nodeTagProvider || !tagDefinitionProvider) {
			return [];
		}

		const tagIds = nodeTagProvider.getTags(node.id);
		const definitions: TagDefinition[] = [];
		for (const tagId of tagIds) {
			definitions.push(tagDefinitionProvider.getTagDefinition(tagId));
		}

		return definitions;
	});

	/** Filtered children based on selected tag IDs. */
	const filteredChildren: TreeviewNode[] = $derived.by(() => {
		if (!node.children?.length) {
			return [];
		}
		if (selectedTagIds.size === 0) {
			return node.children;
		}
		return node.children.filter((child) => nodeMatchesTagFilter(child));
	});

	/** Whether this node represents a folder (has children). */
	const isFolder: boolean = $derived(!!(node.children && node.children.length));

	/** Whether this node has visibility controls. */
	const hasVisibility: boolean = $derived.by(() => {
		if (isFolderNode(node) && !isChecked) {
			return false;
		}

		return true;
	});

	/** Reactive state for the node's icon. */
	let icon: string | Component = $state('');

	/** Reactive state for visibility icon. */
	let showVisibility: boolean = $state(false);

	/** Reactive state for visibility animation. */
	let isVisibilityAnimatingOut: boolean = $state(false);

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
		icon = getNodeIcon(nodeConfig?.typology ?? TreeviewNodeTypology.Variable, isOpen);
	});

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

	/**
	 * Checks if a node or any of its descendants match the selected tag filters.
	 * @param targetNode - The node to check.
	 * @returns True if the node or any descendant matches the filter criteria.
	 */
	function nodeMatchesTagFilter(targetNode: TreeviewNode): boolean {
		if (selectedTagIds.size === 0) {
			return true;
		}

		const nodeTags = nodeTagProvider?.getTags(targetNode.id) ?? [];
		const hasMatchingTag = nodeTags.some((tagId) => selectedTagIds.has(tagId));
		if (hasMatchingTag) {
			return true;
		}

		if (targetNode.children?.length) {
			return targetNode.children.some((child) => nodeMatchesTagFilter(child));
		}

		return false;
	}

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

	/**
	 * Checks if a given node is a folder TreeviewNode.
	 * @param node The node to check.
	 * @returns True if the node is a folder TreeviewNode, false otherwise.
	 */
	function isFolderNode(node: TreeviewNode): node is TreeviewNode {
		return node.type === TreeviewNodeType.Folder;
	}
</script>

{#snippet content()}
	{#if !nodeConfig?.isHidden}
		{#if isFolder}
			<NodeContent
				{icon}
				name={node.name}
				{depth}
				tagDefinitions={nodeTagDefinitions}
				onclick={handleFolderClick}
				{isFolder}
				{isOpen}
			>
				{#snippet children()}
					<div class="flex items-center">
						{#if nodeConfig?.metadataTabInfoUrl}
							<div class="mr-2">
								<InfoButton layerId={node.id} />
							</div>
						{/if}
						{#if isDownloadable}
							<div class="mr-2">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</div>
						{/if}
						{#if showVisibility}
							<div class="visibility-wrapper" class:visible={!isVisibilityAnimatingOut}>
								<div class="visibility-inner">
									<VisibilityCheckbox
										checked={isChecked}
										indeterminate={getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
										onCheckedChange={toggleVisible}
									/>
								</div>
							</div>
						{/if}
					</div>
				{/snippet}
			</NodeContent>
		{:else}
			<NodeContent
				{icon}
				name={node.name}
				{depth}
				tagDefinitions={nodeTagDefinitions}
				onclick={handleClick}
				{isFolder}
			>
				{#snippet children()}
					<div class="flex items-center">
						{#if nodeConfig?.metadataTabInfoUrl}
							<div class="mr-2">
								<InfoButton layerId={node.id} />
							</div>
						{/if}
						{#if isDownloadable}
							<div class="mr-2">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</div>
						{/if}
						{#if hasVisibility}
							<VisibilityCheckbox
								checked={isChecked}
								indeterminate={getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
								onCheckedChange={toggleVisible}
							/>
						{/if}
					</div>
				{/snippet}
			</NodeContent>
		{/if}
	{/if}
{/snippet}

{#snippet childNode(node: TreeviewNode)}
	{#if isFolder && isOpen && !nodeConfig?.isHidden}
		<Node
			{nodeConfigProvider}
			{nodeTagProvider}
			{tagDefinitionProvider}
			{node}
			{selectedTagIds}
			depth={depth + 1}
		/>
	{/if}
{/snippet}

<NodeAnimation {isOpen} {content} childNodes={isFolder ? filteredChildren : null} {childNode} />

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
