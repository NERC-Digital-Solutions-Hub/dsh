<!-- Node.svelte -->
<script lang="ts">
	import Node from './arcgis-tree-view-node.svelte';
	import { getLayerIcon } from './get-layer-icon';

	type TreeNode = {
		id: string;
		name: string;
		layer: __esri.Layer | __esri.Sublayer;
		children?: TreeNode[];
	};

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
	const widthCalc = `calc(100% - ${depth * 1}rem)`;

	const hasVisibility = !!node.layer && 'visible' in node.layer;
	const isFolder = !!(node.children && node.children.length);

	const getNodeIcon = (): string => {
		if (useLayerTypeIcon) {
			return getLayerIcon(node.layer, isFolder);
		}

		// Default icons
		if (isFolder) {
			return isOpen
				? `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`
				: `<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`;
		}

		return `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/>`;
	};

	let isOpen = $state(false);
	let isChecked = $state<boolean>(false);

	$effect(() => {
		if (!node) {
			return;
		}

		// Use centralized visibility state if provided, otherwise fall back to layer visibility
		const isVisible = getNodeVisibility ? getNodeVisibility(node.id) : undefined;
		isChecked = isVisible !== undefined ? isVisible : node.layer.visible;
	});

	function toggleVisible() {
		if (!hasVisibility || !onNodeVisibilityChange) {
			return;
		}

		// Use centralized visibility handler
		onNodeVisibilityChange(node, !isChecked);
	}

	function handleClick() {
		onNodeClick?.(node);
	}

	function handleFolderClick() {
		isOpen = !isOpen;
		onNodeClick?.(node);
	}

	function handleCheckboxChange(event: Event) {
		const target = event.target as HTMLInputElement;
		isChecked = target.checked;
	}
</script>

{#if isFolder}
	<div class="w-full">
		<!-- Parent folder with its own border - entire area clickable -->
		<button
			class="mb-1 cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left transition-colors hover:bg-card/70"
			style="width: {widthCalc};"
			onclick={handleFolderClick}
		>
			<div class="flex w-full items-center justify-between gap-2">
				<div class="pointer-events-none flex min-w-0 flex-1 items-start gap-1">
					<span class="inline-block size-4" aria-hidden="true">{@html getNodeIcon()}</span>
					<span class="justify-start text-left break-words">{node.name}</span>
				</div>
				<!-- No checkbox for folder nodes -->
				{#if hasVisibility}
					<div class="pointer-events-auto mt-0.5 flex-shrink-0">
						<input
							type="checkbox"
							bind:checked={isChecked}
							onchange={handleCheckboxChange}
							onclick={(e) => {
								e.stopPropagation();
								onNodeVisibilityChange?.(node, !isChecked);
							}}
							class="h-4 w-4 rounded border-border/30 text-primary focus:ring-2 focus:ring-primary/20"
						/>
					</div>
				{/if}
			</div>
		</button>

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
	<button
		class="mb-1 cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left transition-colors hover:bg-card/70"
		style="width: {widthCalc};"
		onclick={handleClick}
	>
		<div class="flex w-full items-start justify-between gap-2">
			<div class="pointer-events-none flex min-w-0 flex-1 items-start gap-1">
				<span class="inline-block size-4" aria-hidden="true">{@html getNodeIcon()}</span>
				<span class="block w-full text-left break-words">{node.name}</span>
			</div>
			<div class="pointer-events-auto mt-0.5 flex-shrink-0">
				<input
					type="checkbox"
					bind:checked={isChecked}
					onchange={handleCheckboxChange}
					onclick={(e) => {
						e.stopPropagation();
						onNodeVisibilityChange?.(node, !isChecked);
					}}
					class="h-4 w-4 rounded border-border/30 text-primary focus:ring-2 focus:ring-primary/20"
				/>
			</div>
		</div>
	</button>
{/if}
