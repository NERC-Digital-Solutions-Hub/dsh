<script lang="ts">
	import { Card } from '$lib/Components/shadcn/card';
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		children?: Snippet;
		footer?: Snippet;
		hasFooter?: boolean;
	};

	const { title = '', children, footer, hasFooter = false }: Props = $props();
</script>

<Card class="data-item-card gap-0">
	<div class="data-item">
		<span class="data-name" {title}>
			{title}
		</span>
		<div class="data-actions">
			{@render children?.()}
		</div>
	</div>
	{#if hasFooter && footer}
		<div class="data-item-footer">
			{@render footer()}
		</div>
	{/if}
</Card>

<style>
	:global(.data-item-card) {
		padding: 0 !important;
		margin: 0 0 0.25rem 0 !important;
		background: var(--background);
		box-shadow: none;
	}

	.data-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		white-space: nowrap; /* Prevent wrapping */
	}

	.data-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap; /* Prevent text wrapping */
	}

	.data-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem; /* 8px gap between filter and remove buttons */
		flex-shrink: 0; /* Prevent buttons from shrinking */
		margin-left: 0.5rem;
	}

	.data-item-footer {
		padding: 0 0.5rem 0.5rem;
	}
</style>
