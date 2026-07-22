<script lang="ts">
	import ItemDialog from '$lib/components/item-dialog/item-dialog.svelte';
	import { Card } from '$lib/components/shadcn/card';
	import { Button } from '$lib/components/shadcn/button';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import MapThumbnail from '$lib/components/map-thumbnail/MapThumbnail.svelte';
	import type { CatalogueResultCardRecord } from '$lib/utils/catalogue-ui';

	interface Props {
		record: CatalogueResultCardRecord;
		selectedArchetype?: ArchetypeDefinition | null;
	}

	let { record, selectedArchetype = null }: Props = $props();

	let isExpanded = $state(false);
	let isItemDialogOpen = $state(false);

	const PREVIEW_LENGTH = 320;

	const description = $derived(record.abstract?.trim() ?? '');
	const truncatedDescription = $derived(
		description.length > PREVIEW_LENGTH
			? `${description.slice(0, PREVIEW_LENGTH).trimEnd()}...`
			: description
	);
	const displayDescription = $derived(isExpanded ? description : truncatedDescription);
	const shouldShowExpandButton = $derived(description.length > PREVIEW_LENGTH);
	function formatDate(dateString: string): string {
		const parsedDate = new Date(dateString);

		if (Number.isNaN(parsedDate.getTime())) {
			return dateString;
		}

		return parsedDate.toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function toggleExpanded() {
		if (shouldShowExpandButton) {
			isExpanded = !isExpanded;
		}
	}
</script>

<Card
	class="result-card flex cursor-pointer border py-0 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md {isExpanded
		? 'h-auto'
		: ''}"
>
	<div class="result-card__layout">
		{#if record.boundingBox}
			<div class="map-preview">
				<MapThumbnail boundingBox={record.boundingBox} alt={`Map preview for ${record.title}`} />
			</div>
		{/if}

		<div class="result-card__content">
			<div class="result-card__header">
				<h2 class="result-card__title line-clamp-2">
					{record.title}
				</h2>

				<div class="result-card__meta">
					<span>
						Published: {formatDate(record.publicationDate ?? record.revisionDate ?? 'N/A')}
					</span>
				</div>
			</div>

			{#if shouldShowExpandButton}
				<button
					type="button"
					class="result-card__body result-card__body--button"
					onclick={toggleExpanded}
				>
					<span class="result-card__description {isExpanded ? '' : 'line-clamp-6'}">
						{displayDescription}
					</span>
					{#if !isExpanded}
						<span class="result-card__expand">Click to read more...</span>
					{/if}
				</button>
			{:else}
				<div class="result-card__body">
					<p class="result-card__description">
						{displayDescription}
					</p>
				</div>
			{/if}

			<div class="result-card__footer">
				<Button
					variant="default"
					size="sm"
					class="result-card__button w-full"
					onclick={(event) => {
						event.stopPropagation();
						isItemDialogOpen = true;
					}}
				>
					View Details
				</Button>
			</div>
		</div>
	</div>
</Card>

<ItemDialog bind:open={isItemDialogOpen} item={record.detailItem} {selectedArchetype} />

<style>
	:global(.result-card) {
		overflow: hidden;
	}

	.result-card__layout {
		display: flex;
		align-items: flex-start;
		gap: 1.35rem;
		width: 100%;
		min-height: 0;
		padding: 1rem;
	}

	.result-card__content {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.8rem;
		min-width: 0;
		padding: 0.15rem 0.25rem 0 0;
	}

	.result-card__header {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.result-card__title {
		margin: 0;
		max-width: 58rem;
		font-size: 1.25rem;
		font-weight: 650;
		letter-spacing: 0;
		line-height: 1.3;
	}

	.result-card__meta {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--muted) / 0.45);
		padding: 0.28rem 0.65rem;
		font-size: 0.8125rem;
		line-height: 1.2;
		color: hsl(var(--muted-foreground));
	}

	.result-card__body {
		max-width: 80ch;
	}

	.result-card__body--button {
		display: block;
		width: 100%;
		border: 0;
		background: transparent;
		padding: 0;
		text-align: left;
		font: inherit;
		cursor: pointer;
	}

	.result-card__description {
		display: block;
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	.result-card__expand {
		display: block;
		margin-top: 0.55rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--primary));
	}

	.result-card__footer {
		margin-top: 0.55rem;
		padding-top: 0;
	}

	:global(.result-card__button) {
		height: 2.6rem;
		border-radius: 0.5rem;
		font-weight: 500;
	}

	.map-preview {
		flex: 0 0 clamp(250px, 18vw, 285px);
		width: clamp(250px, 18vw, 285px);
		min-width: clamp(250px, 18vw, 285px);
		align-self: center;
		aspect-ratio: 1 / 1;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--muted));
		overflow: hidden;
		pointer-events: none;
		user-select: none;
	}

	@media (max-width: 900px) {
		.result-card__layout {
			flex-direction: column;
			gap: 1rem;
			min-height: 0;
			padding: 1rem;
		}

		.map-preview {
			flex: 0 0 auto;
			width: 100%;
			min-width: 0;
			min-height: 220px;
			align-self: stretch;
			aspect-ratio: 16 / 9;
		}

		.result-card__content {
			padding: 0.25rem 0.25rem 0;
		}

		.result-card__footer {
			padding-top: 0.25rem;
		}
	}

	@media (max-width: 560px) {
		.map-preview {
			min-height: 190px;
		}

		.result-card__content {
			padding: 0;
		}

		.result-card__title {
			font-size: 1.125rem;
		}
	}
</style>
