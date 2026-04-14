<!-- Node.svelte -->
<script lang="ts">
	import InfoButton from '$lib/Components/Treeview/Data/InfoButton.svelte';
	import Node from '$lib/Components/Treeview/Data/Node.svelte';
	import NodeContent from '$lib/Components/Treeview/Data/NodeContent.svelte';
	import { getNodeIcon } from '$lib/Components/Treeview/GetNodeIcon';
	import NodeAnimation from '$lib/Components/Treeview/NodeAnimation.svelte';
	import type { TreeviewSearch } from '$lib/Components/Treeview/TreeviewSearch.svelte.js';
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
	import { untrack } from 'svelte';
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

		/** Optional search state for filtering and expansion control. */
		search?: TreeviewSearch | null;
	};

	const {
		node,
		depth = 0,
		nodeConfigProvider,
		nodeTagProvider,
		tagDefinitionProvider,
		selectedTagIds = new Set<string>(),
		search = null
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

	/** Filtered children based on selected tag IDs and active search. */
	const filteredChildren: TreeviewNode[] = $derived.by(() => {
		if (!node.children?.length) {
			return [];
		}
		let children = node.children;
		if (selectedTagIds.size > 0) {
			children = children.filter((child) => nodeMatchesTagFilter(child));
		}
		if (search?.isFiltering) {
			children = children.filter((child) => search.nodeOrDescendantMatches(child.id));
		}
		return children;
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

	/** Track previous search-active state for save/restore transitions. */
	let wasSearchActive = false;

	/** Search-driven expansion: save state on activation, auto-expand ancestors, restore on clear. */
	$effect(() => {
		if (!search || !isFolder) return;

		const active = search.isActive;
		const filtering = search.isFiltering;
		const currentIsOpen = untrack(() => isOpen);

		if (active && !wasSearchActive) {
			// Search just became active — snapshot current expansion
			search.saveExpansionState(node.id, currentIsOpen);
		}

		if (filtering && search.ancestorIds.has(node.id)) {
			isOpen = true;
		}

		if (!active && wasSearchActive) {
			// Search just cleared — restore unless user toggled
			const saved = search.getSavedExpansionState(node.id);
			if (saved !== undefined) {
				isOpen = saved;
			}
		}

		wasSearchActive = active;
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
		if (search?.isActive) {
			search.recordUserToggle(node.id);
		}
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
					<div class="node-actions">
						{#if nodeConfig?.metadataTabInfoUrl}
							<span class="action-slot">
								<InfoButton layerId={node.id} />
							</span>
						{/if}

						{#if isDownloadable}
							<span class="action-slot">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</span>
						{/if}

						{#if showVisibility}
							<span
								class="action-slot visibility-wrapper"
								class:visible={!isVisibilityAnimatingOut}
							>
								<span class="visibility-inner">
									<VisibilityCheckbox
										checked={isChecked}
										indeterminate={getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
										onCheckedChange={toggleVisible}
									/>
								</span>
								{#if getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
									<span class="indeterminate-label text-muted-foreground">zoom</span>
								{/if}
							</span>
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
					<div class="node-actions">
						{#if nodeConfig?.metadataTabInfoUrl}
							<span class="action-slot">
								<InfoButton layerId={node.id} />
							</span>
						{/if}

						{#if isDownloadable}
							<span class="action-slot">
								<DownloadButton {node} {onDownloadStateChanged} {getDownloadState} />
							</span>
						{/if}

						{#if showVisibility}
							<span
								class="action-slot visibility-wrapper"
								class:visible={!isVisibilityAnimatingOut}
							>
								<span class="visibility-inner">
									<VisibilityCheckbox
										checked={isChecked}
										indeterminate={getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
										onCheckedChange={toggleVisible}
									/>
								</span>
								{#if getNodeDrawState?.(node.id) === NodeDrawState.Suspended}
									<span class="indeterminate-label text-muted-foreground">zoom</span>
								{/if}
							</span>
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
			{search}
			depth={depth + 1}
		/>
	{/if}
{/snippet}

<NodeAnimation
	{isOpen}
	{content}
	childNodes={isFolder ? filteredChildren : null}
	{childNode}
	animate={!search?.isActive}
/>

<style>
	.node-actions {
		display: inline-flex;
		align-items: center; /* same vertical axis */
		gap: 0rem; /* same spacing between all */
	}

	/* every action gets the same “slot” so icons/checkbox align */
	.action-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1rem; /* pick a value that matches your buttons */
		width: 1.5rem; /* optional: makes spacing visually identical */
	}

	/* keep your animation, but don't break alignment */
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
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: translateX(10px);
		transform-origin: center;
		transition:
			opacity 0.2s ease-out,
			transform 0.2s ease-out;
	}

	.visibility-wrapper.visible .visibility-inner {
		opacity: 1;
		transform: translateX(0px);
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
