<script lang="ts">
	import Self from './xml-tree-node.svelte';
	import type { XmlElementNode, XmlTreeNode } from './xml-tree.types';

	type Props = {
		node: XmlTreeNode;
		depth?: number;
		expandAll?: boolean;
	};

	let { node, depth = 0, expandAll }: Props = $props();

	let open = $state(false);
	let hasInitializedOpenState = false;
	let hasUserToggled = $state(false);

	const INDENT_PER_LEVEL_PX = 14;
	const MAX_INDENT_PX = 140;
	const indentStyle = $derived(
		`padding-left: ${Math.min(depth * INDENT_PER_LEVEL_PX, MAX_INDENT_PX)}px;`
	);
	const toggle = () => {
		hasUserToggled = true;
		open = !open;
	};

	const elementNode = $derived(node.kind === 'element' ? (node as XmlElementNode) : null);
	const hasChildren = $derived((elementNode?.children.length ?? 0) > 0);
	const hasAttrs = $derived((elementNode ? Object.keys(elementNode.attrs).length : 0) > 0);

	$effect(() => {
		if (!hasInitializedOpenState) {
			open = typeof expandAll === 'boolean' ? expandAll : depth < 1;
			hasInitializedOpenState = true;
		}
	});

	$effect(() => {
		if (!hasUserToggled && typeof expandAll === 'boolean') {
			open = expandAll;
		}
	});

	function attrEntries(attrs: Record<string, string>): Array<[string, string]> {
		return Object.entries(attrs);
	}
</script>

{#if node.kind === 'element'}
	<div class="line" style={indentStyle}>
		<button
			class="twisty"
			type="button"
			aria-label={open ? 'Collapse' : 'Expand'}
			onclick={toggle}
			disabled={!hasChildren}
			title={!hasChildren ? 'No children' : open ? 'Collapse' : 'Expand'}
		>
			{#if hasChildren}{open ? '▼' : '▶'}{:else}•{/if}
		</button>

		<span class="punct">&lt;</span><span class="tag">{elementNode?.name}</span>
		{#if hasAttrs}
			{#each attrEntries(elementNode?.attrs ?? {}) as [k, v]}
				<span> </span><span class="attr">{k}</span><span class="punct">=</span><span class="string"
					>"{v}"</span
				>
			{/each}
		{/if}
		<span class="punct">&gt;</span>

		{#if !hasChildren}
			<span class="punct">&lt;/</span><span class="tag">{elementNode?.name}</span><span
				class="punct">&gt;</span
			>
		{:else if !open}
			<span class="punct">...</span>
			<span class="punct">&lt;/</span><span class="tag">{elementNode?.name}</span><span
				class="punct">&gt;</span
			>
		{/if}
	</div>

	{#if hasChildren && open}
		{#each elementNode?.children ?? [] as child}
			<Self node={child} depth={depth + 1} {expandAll} />
		{/each}

		<div class="line" style={indentStyle}>
			<span class="twisty-placeholder"></span>
			<span class="punct">&lt;/</span><span class="tag">{elementNode?.name}</span><span
				class="punct">&gt;</span
			>
		</div>
	{/if}
{:else if node.kind === 'text'}
	<div class="line" style={indentStyle}>
		<span class="twisty-placeholder"></span>
		<span class="text">{node.text}</span>
	</div>
{:else if node.kind === 'comment'}
	<div class="line" style={indentStyle}>
		<span class="twisty-placeholder"></span>
		<span class="comment">&lt;!-- {node.text} --&gt;</span>
	</div>
{:else if node.kind === 'cdata'}
	<div class="line" style={indentStyle}>
		<span class="twisty-placeholder"></span>
		<span class="cdata">&lt;![CDATA[{node.text}]]&gt;</span>
	</div>
{/if}

<style>
	.line {
		white-space: normal;
		overflow-wrap: anywhere;
		word-break: break-word;
		line-height: 1.6;
	}
	.twisty {
		width: 22px;
		border: 0;
		background: transparent;
		cursor: pointer;
		color: #666;
		padding: 0;
		margin-right: 2px;
	}
	.twisty:disabled {
		cursor: default;
		color: #999;
	}
	.twisty-placeholder {
		display: inline-block;
		width: 22px;
		margin-right: 2px;
	}

	/* “node type” coloring */
	.punct {
		color: #666;
	}
	.tag {
		color: #1d4ed8;
	} /* element names */
	.attr {
		color: #0f766e;
	} /* attribute names */
	.string {
		color: #b45309;
	} /* attribute values */
	.text {
		color: #111827;
	} /* text nodes */
	.comment {
		color: #6b7280;
		font-style: italic;
	}
	.cdata {
		color: #7c3aed;
	}
</style>
