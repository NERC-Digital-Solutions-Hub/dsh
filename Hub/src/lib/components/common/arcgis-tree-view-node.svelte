<!-- Node.svelte -->
<script lang="ts">
	import * as TreeView from '$lib/components/ui/tree-view/index.js';
	import Node from './arcgis-tree-view-node.svelte';

	type TreeNode = {
		id: string;
		name: string;
		layer?: __esri.Layer | __esri.Sublayer;
		children?: TreeNode[];
	};

	type Props = {
		node: TreeNode;
		showVisibility?: boolean;
		onNodeClick?: (node: TreeNode) => void;
	};

	const { node, showVisibility = true, onNodeClick }: Props = $props();

	const hasVisibility = !!node.layer && 'visible' in node.layer;
	let isVisible = $state<boolean>(hasVisibility ? (node.layer as any).visible : false);

	if (hasVisibility) {
		$effect(() => {
			isVisible = (node.layer as any).visible;
		});
	}

	function toggleVisible() {
		if (!hasVisibility) return;
		(node.layer as any).visible = !isVisible;
		isVisible = (node.layer as any).visible;
	}

	function handleClick() {
		onNodeClick?.(node);
	}

	function handleFolderClick() {
		isOpen = !isOpen;
		onNodeClick?.(node);
	}

	const isFolder = !!(node.children && node.children.length);
	let isOpen = $state(false);
</script>

{#if isFolder}
	<div class="w-full">
		<!-- Parent folder with its own border - entire area clickable -->
		<button
			class="mb-1 w-full cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left transition-colors hover:bg-card/70"
			onclick={handleFolderClick}
		>
			<div class="flex w-full items-start justify-between">
				<div class="pointer-events-none flex flex-1 items-center gap-1">
					{#if isOpen}
						<svg
							class="size-4 flex-shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
							/>
						</svg>
					{:else}
						<svg
							class="size-4 flex-shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
							/>
						</svg>
					{/if}
					<span class="justify-start text-left">{node.name}</span>
				</div>
				{#if showVisibility && hasVisibility}
					<div class="pointer-events-auto ml-2 flex flex-shrink-0 items-center gap-1 text-xs">
						<label class="flex cursor-pointer items-center gap-1">
							<input type="checkbox" bind:checked={isVisible} onchange={toggleVisible} />
							<span class="text-muted-foreground">Visibility</span>
						</label>
					</div>
				{/if}
			</div>
		</button>

		<!-- Children nodes outside parent border - only show when open -->
		{#if isOpen}
			<div class="ml-4 w-full">
				{#each node.children ?? [] as child (child.id)}
					<Node node={child} {showVisibility} {onNodeClick} />
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<button
		class="mb-1 w-full cursor-pointer rounded-md border border-border/30 bg-card/50 p-2 text-left transition-colors hover:bg-card/70"
		onclick={handleClick}
	>
		<div class="flex w-full items-start justify-between">
			<div class="pointer-events-none flex flex-1 items-center gap-1">
				<svg
					class="size-4 flex-shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
					<polyline points="14,2 14,8 20,8" />
				</svg>
				<span class="block w-full text-left">{node.name}</span>
			</div>
			{#if showVisibility && hasVisibility}
				<div class="pointer-events-auto ml-2 flex flex-shrink-0 items-center gap-1 text-xs">
					<label class="flex cursor-pointer items-center gap-1">
						<input type="checkbox" bind:checked={isVisible} onchange={toggleVisible} />
					</label>
				</div>
			{/if}
		</div>
	</button>
{/if}
