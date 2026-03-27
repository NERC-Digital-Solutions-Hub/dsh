<script lang="ts">
	import MapSection from '$lib/components/map-view/map-section.svelte';
	import * as Accordion from '$lib/components/shadcn/accordion/index.js';
	import { Button } from '$lib/components/shadcn/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/shadcn/card';
	import { Separator } from '$lib/components/shadcn/separator';
	import type { CatalogueItemDetail } from '$lib/utils/catalogue-ui';
	import { formatDisplayDate } from '$lib/utils/catalogue-ui';

	type Props = {
		item: CatalogueItemDetail;
		showSummaryText?: boolean;
		summaryLayout?: 'stacked' | 'split';
	};

	let { item, showSummaryText = true, summaryLayout = 'stacked' }: Props = $props();

	const mapBoundingBox = $derived(
		item.boundingBox
			? {
					xmin: item.boundingBox.westBoundLongitude,
					ymin: item.boundingBox.southBoundLatitude,
					xmax: item.boundingBox.eastBoundLongitude,
					ymax: item.boundingBox.northBoundLatitude,
					spatialReference: { wkid: 4326 }
				}
			: null
	);

	const eyebrowClass = 'text-sm font-semibold text-foreground';
	const metadataLabelClass = 'text-sm font-semibold text-foreground';
	const metadataValueClass = 'text-sm leading-6 text-foreground';
	const detailTitleClass = 'text-sm font-semibold text-foreground';
	const emptyTextClass = 'm-0 text-sm leading-6 text-muted-foreground';
	const chipClass =
		'inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground';
	const groupedArchetypeLinks = $derived.by(() => {
		const grouped = new Map<string, typeof item.archetypeLinks>();

		for (const link of item.archetypeLinks) {
			const key = link.group?.trim() || 'Other';
			grouped.set(key, [...(grouped.get(key) ?? []), link]);
		}

		return [...grouped.entries()].map(([group, links]) => ({ group, links }));
	});
</script>

<div class="flex flex-col gap-4">
	{#if summaryLayout === 'split'}
		<div class="flex flex-col gap-4">
			<Card class="border p-0 shadow-none">
				<CardContent class="px-4 py-3 sm:px-5 sm:py-4">
					<div class="grid grid-cols-1 gap-3 xl:grid-cols-4">
						<div class="flex flex-col gap-1">
							<div class={metadataLabelClass}>Resource type</div>
							<div class={metadataValueClass}>{item.resourceType}</div>
						</div>
						<div class="flex flex-col gap-1">
							<div class={metadataLabelClass}>Published</div>
							<div class={metadataValueClass}>{formatDisplayDate(item.publicationDate)}</div>
						</div>
						<div class="flex flex-col gap-1">
							<div class={metadataLabelClass}>Formats</div>
							<div class="flex flex-wrap gap-2">
								{#each item.formats as format (format)}
									<span class={chipClass}>{format}</span>
								{/each}
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<div class={metadataLabelClass}>Tags</div>
							{#if item.tags.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each item.tags as tag, index (`summary-tag-${tag}-${index}`)}
										<span class={chipClass}>{tag}</span>
									{/each}
								</div>
							{:else}
								<p class={emptyTextClass}>No tags available.</p>
							{/if}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="border p-0 shadow-none">
				<CardContent class="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5">
					<div class={eyebrowClass}>Description</div>
					<div class="w-full">
						<p class="m-0 text-[1rem] leading-7 text-foreground sm:text-[1.02rem] sm:leading-8">
							{item.description}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	{:else}
		<Card class="border shadow-none">
			{#if showSummaryText}
				<CardHeader class="space-y-2 pb-4">
					<div class={eyebrowClass}>Catalogue item</div>
					<CardTitle class="text-3xl leading-tight">{item.title}</CardTitle>
					<CardDescription class="max-w-[72ch] text-base leading-7">
						{item.description}
					</CardDescription>
				</CardHeader>
			{/if}

			<CardContent class={showSummaryText ? 'pt-0' : 'px-4 py-4 sm:px-5 sm:py-5'}>
				<div class="grid grid-cols-1 gap-3 xl:grid-cols-4">
					<div class="flex flex-col gap-1">
						<div class={metadataLabelClass}>Resource type</div>
						<div class={metadataValueClass}>{item.resourceType}</div>
					</div>
					<div class="flex flex-col gap-1">
						<div class={metadataLabelClass}>Published</div>
						<div class={metadataValueClass}>{formatDisplayDate(item.publicationDate)}</div>
					</div>
					<div class="flex flex-col gap-1">
						<div class={metadataLabelClass}>Formats</div>
						<div class="flex flex-wrap gap-2">
							{#each item.formats as format (format)}
								<span class={chipClass}>{format}</span>
							{/each}
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<div class={metadataLabelClass}>Tags</div>
						{#if item.tags.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each item.tags as tag, index (`summary-tag-${tag}-${index}`)}
									<span class={chipClass}>{tag}</span>
								{/each}
							</div>
						{:else}
							<p class={emptyTextClass}>No tags available.</p>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
		<Card class="border shadow-none">
			<CardHeader class="pb-4">
				<CardTitle>Additional information</CardTitle>
				<CardDescription>
					Additional descriptive metadata and placeholders for fields that will be expanded later.
				</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4 pt-0">
				<div class="flex flex-col gap-2.5">
					{#if item.timespans.length > 0}
						<Accordion.Item
							title="Time coverage"
							subtitle={`${item.timespans.length} entr${item.timespans.length === 1 ? 'y' : 'ies'}`}
						>
							<div class="flex flex-col gap-3">
								{#each item.timespans as timespan, index (`${timespan.start ?? 'start'}-${timespan.end ?? 'end'}-${index}`)}
									<div class="rounded-md border p-3">
										<div class="text-sm font-semibold text-foreground">{timespan.label}</div>
										<div class="mt-1 flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
											<div>Start: {timespan.start ? formatDisplayDate(timespan.start) : 'N/A'}</div>
											<div>End: {timespan.end ? formatDisplayDate(timespan.end) : 'N/A'}</div>
										</div>
									</div>
								{/each}
							</div>
						</Accordion.Item>
					{:else}
						<p class={emptyTextClass}>
							Time coverage information will appear here when supplied by the API.
						</p>
					{/if}
				</div>

				<Separator />

				<div class="flex flex-col gap-2.5">
					{#if item.credits.length > 0}
						<Accordion.Item
							title="Credits"
							subtitle={`${item.credits.length} entr${item.credits.length === 1 ? 'y' : 'ies'}`}
						>
							<ul class="m-0 list-disc pl-5 text-sm leading-6 text-muted-foreground">
								{#each item.credits as credit, index (`credit-${credit}-${index}`)}
									<li>{credit}</li>
								{/each}
							</ul>
						</Accordion.Item>
					{:else}
						<p class={emptyTextClass}>Credits will appear here when supplied by the API.</p>
					{/if}
				</div>

				<Separator />

				<div class="flex flex-col gap-2.5">
					{#if item.licences.length > 0}
						<Accordion.Item
							title="Licences"
							subtitle={`${item.licences.length} entr${item.licences.length === 1 ? 'y' : 'ies'}`}
						>
							<ul class="m-0 list-disc pl-5 text-sm leading-6 text-muted-foreground">
								{#each item.licences as licence, index (`licence-${licence}-${index}`)}
									<li>{licence}</li>
								{/each}
							</ul>
						</Accordion.Item>
					{:else}
						<p class={emptyTextClass}>
							Licence information will appear here when supplied by the API.
						</p>
					{/if}
				</div>

			</CardContent>
		</Card>

		<Card class="border shadow-none">
			<CardHeader class="pb-4">
				<CardTitle>Linked resources</CardTitle>
				<CardDescription>Archetype links and external resource destinations.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-3 pt-0">
				{#if groupedArchetypeLinks.length > 0}
					<div class="flex flex-col gap-3">
						{#each groupedArchetypeLinks as entry, index (`${entry.group}-${index}`)}
							<Accordion.Item
								title={entry.group}
								subtitle={`${entry.links.length} resource${entry.links.length === 1 ? '' : 's'}`}
							>
								<div class="flex flex-col gap-2">
									{#each entry.links as link, linkIndex (`${link.url}-${linkIndex}`)}
										<a
											class="flex items-center justify-between gap-4 rounded-md border bg-background p-3 text-inherit transition hover:-translate-y-px hover:border-primary hover:bg-accent max-sm:flex-col max-sm:items-stretch"
											href={link.url}
											target="_blank"
											rel="noreferrer noopener"
										>
											<div>
												<div class="text-sm font-semibold text-foreground">{link.label}</div>
												<div class="mt-1 text-xs text-muted-foreground break-all">{link.url}</div>
											</div>
											<Button variant="outline" size="sm">Open</Button>
										</a>
									{/each}
								</div>
							</Accordion.Item>
						{/each}
					</div>
				{:else}
					<p class={emptyTextClass}>Archetype links will appear here when they are available.</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	{#if mapBoundingBox}
		<Card>
			<CardHeader class="pb-4">
				<CardTitle>Spatial preview</CardTitle>
				<CardDescription>Approximate bounding box for the selected item.</CardDescription>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="h-[360px] overflow-hidden rounded-md">
					<MapSection
						boundingBox={mapBoundingBox}
						showBoundingBox={true}
						boundingBoxColor={[255, 0, 0, 0.3]}
						interactive={false}
					/>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
