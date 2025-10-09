<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import MapSection from '$lib/components/common/catalogue/map-view/map-section.svelte';
	import type { MetadataCommonDto } from '$lib/types/metadata';

	interface Props {
		record: MetadataCommonDto;
		onView?: () => void;
	}

	let { record, onView }: Props = $props();

	let isExpanded = $state(false);

	// Truncate abstract to a reasonable length when not expanded
	const PREVIEW_LENGTH = 500;

	const truncatedAbstract = $derived(
		record.abstract.length > PREVIEW_LENGTH
			? record.abstract.substring(0, PREVIEW_LENGTH) + '...'
			: record.abstract
	);

	const displayAbstract = $derived(isExpanded ? record.abstract : truncatedAbstract);
	const shouldShowExpandButton = $derived(record.abstract.length > PREVIEW_LENGTH);

	// Convert BoundingBoxDto to map bounding box format
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

	function toggleExpanded() {
		if (shouldShowExpandButton) {
			isExpanded = !isExpanded;
		}
	}

	function handleView() {
		onView?.();
	}

	function formatDate(dateString: string): string {
		try {
			console.log('date', dateString);
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return dateString;
		}
	}
</script>

<Card
	class="flex cursor-pointer transition-all duration-200 hover:shadow-lg {isExpanded
		? 'h-auto'
		: 'min-h-[300px]'}"
>
	<div class="flex w-full flex-row">
		<!-- Map Section (Left Side) -->
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

		<!-- Content Section (Right Side) -->
		<div class="flex flex-1 flex-col" onclick={toggleExpanded}>
			<CardHeader class="pb-3">
				<CardTitle class="line-clamp-2 text-lg font-semibold">{record.title}</CardTitle>
				<div class="text-sm text-muted-foreground">
					Published: {formatDate(record.publicationDate ?? record.revisionDate ?? 'N/A')}
				</div>
			</CardHeader>

			<CardContent class="flex-1 pb-2">
				<CardDescription class="text-sm leading-relaxed {isExpanded ? '' : 'line-clamp-6'}">
					{displayAbstract}
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
					onclick={(e) => {
						e.stopPropagation();
						handleView();
					}}
				>
					View Details
				</Button>
			</CardFooter>
		</div>
	</div>
</Card>

<style>
	.map-preview {
		width: 300px;
		min-width: 300px;
		height: 100%;
		min-height: 300px;
		border-right: 1px solid hsl(var(--border));
		overflow: hidden;
		pointer-events: none; /* Completely disable all mouse interactions */
		user-select: none; /* Prevent text selection */
		padding-left: 1rem;
	}

	@media (max-width: 768px) {
		.map-preview {
			width: 200px;
			min-width: 200px;
			padding-left: 0.75rem;
		}
	}
</style>
