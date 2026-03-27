<script lang="ts">
	import ItemDialog from '$lib/components/item-dialog/item-dialog.svelte';
	import {
		Card,
		CardDescription,
		CardContent,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/shadcn/card';
	import { Button } from '$lib/components/shadcn/button';
	import MapSection from '$lib/components/map-view/map-section.svelte';
	import type { CatalogueResultCardRecord } from '$lib/utils/catalogue-ui';

	interface Props {
		record: CatalogueResultCardRecord;
	}

	let { record }: Props = $props();

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
	const mapBoundingBox = $derived(
		record.boundingBox
			? {
					xmin: record.boundingBox.westBoundLongitude,
					ymin: record.boundingBox.southBoundLatitude,
					xmax: record.boundingBox.eastBoundLongitude,
					ymax: record.boundingBox.northBoundLatitude,
					spatialReference: { wkid: 4326 }
				}
			: null
	);

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
	class="result-card flex cursor-pointer transition-all duration-200 hover:shadow-lg {isExpanded
		? 'h-auto'
		: 'min-h-[300px]'}"
>
	<div class="result-card__layout">
		{#if mapBoundingBox}
			<div class="map-preview">
				<MapSection
					boundingBox={mapBoundingBox}
					showBoundingBox={true}
					boundingBoxColor={[255, 0, 0, 0.3]}
					interactive={false}
				/>
			</div>
		{/if}

		<div class="result-card__content">
			<CardHeader class="pb-3">
				<CardTitle class="line-clamp-2 text-lg font-semibold">
					{record.title}
				</CardTitle>

				<div class="result-card__meta">
					<span>
						Published: {formatDate(record.publicationDate ?? record.revisionDate ?? 'N/A')}
					</span>
				</div>
			</CardHeader>

			<CardContent class="flex-1 pb-2" onclick={toggleExpanded}>
				<CardDescription class="text-sm leading-relaxed {isExpanded ? '' : 'line-clamp-6'}">
					{displayDescription}
				</CardDescription>
				{#if shouldShowExpandButton && !isExpanded}
					<div class="mt-2 text-xs text-muted-foreground">Click to read more...</div>
				{/if}
			</CardContent>

			<CardFooter class="pt-2 pb-4">
				<Button
					variant="default"
					size="sm"
					class="w-full"
					onclick={(event) => {
						event.stopPropagation();
						isItemDialogOpen = true;
					}}
				>
					View Details
				</Button>
			</CardFooter>
		</div>
	</div>
</Card>

<ItemDialog bind:open={isItemDialogOpen} item={record.detailItem} />

<style>
	:global(.result-card) {
		overflow: hidden;
	}

	.result-card__layout {
		display: flex;
		width: 100%;
	}

	.result-card__content {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.result-card__meta {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.map-preview {
		width: 300px;
		min-width: 300px;
		height: 100%;
		min-height: 300px;
		border-right: 1px solid hsl(var(--border));
		overflow: hidden;
		pointer-events: none;
		user-select: none;
		padding-left: 1rem;
	}

	@media (max-width: 768px) {
		.result-card__layout {
			flex-direction: row;
		}

		.map-preview {
			width: 200px;
			min-width: 200px;
			padding-left: 0.75rem;
		}
	}
</style>
