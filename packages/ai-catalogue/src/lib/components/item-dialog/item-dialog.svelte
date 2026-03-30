<script lang="ts">
	import * as Accordion from '$lib/components/shadcn/accordion/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/shadcn/card';
	import { FileText } from '@lucide/svelte';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import MapSection from '$lib/components/map-view/map-section.svelte';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import SummaryDialog from '$lib/components/summary-dialog/summary-dialog.svelte';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import type { CatalogueItemDetail } from '$lib/utils/catalogue-ui';
	import { formatDisplayDate, formatSummaryGroupLabel } from '$lib/utils/catalogue-ui';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import Button from '$lib/components/shadcn/button/button.svelte';

	const tabs = [
		{
			value: 'information',
			label: 'Information'
		},
		{
			value: 'ai-summaries',
			label: 'AI Summaries'
		},
		{
			value: 'supporting-documents',
			label: 'Supporting Documents'
		}
	];

	type Props = {
		item: CatalogueItemDetail;
		selectedArchetype?: ArchetypeDefinition | null;
		open?: boolean;
	};

	let { item, selectedArchetype, open = $bindable(false) }: Props = $props();
	let activeSummary = $state<(typeof item.archetypeLinks)[number] | null>(null);
	let isSummaryDialogOpen = $state(false);

	const emptyTextClass = 'text-sm leading-6 text-muted-foreground';
	const chipClass =
		'inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground';

	const selectedArchetypeId = $derived(
		selectedArchetype?.id !== undefined ? String(selectedArchetype.id) : null
	);

	const groupedSelectedArchetypeSummaries = $derived.by(() => {
		if (!selectedArchetypeId) {
			return [];
		}

		const grouped = new Map<string, typeof item.archetypeLinks>();

		for (const link of item.archetypeLinks) {
			if (link.archetypeId !== selectedArchetypeId) {
				continue;
			}

			const key = link.group?.trim() || 'Other';
			grouped.set(key, [...(grouped.get(key) ?? []), link]);
		}

		return [...grouped.entries()]
			.map(([group, links]) => ({
				group,
				summary: links[0] ?? null,
				count: links.length
			}))
			.filter(
				(
					entry
				): entry is {
					group: string;
					summary: (typeof item.archetypeLinks)[number];
					count: number;
				} => Boolean(entry.summary)
			);
	});

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

	const spatialExtent = $derived.by(() => {
		if (!item.boundingBox) {
			return [];
		}

		return [
			{ label: 'West', value: item.boundingBox.westBoundLongitude },
			{ label: 'East', value: item.boundingBox.eastBoundLongitude },
			{ label: 'South', value: item.boundingBox.southBoundLatitude },
			{ label: 'North', value: item.boundingBox.northBoundLatitude }
		];
	});

	function openSummary(summary: (typeof item.archetypeLinks)[number]) {
		activeSummary = summary;
		isSummaryDialogOpen = true;
	}

	$effect(() => {
		if (!open) {
			isSummaryDialogOpen = false;
			activeSummary = null;
		}
	});
</script>

{#snippet sideMetadataCard()}
	<Card class="h-full min-h-0 overflow-hidden border p-0 shadow-none">
		<ScrollArea class="h-full min-h-0 w-full">
			<CardContent class="flex flex-col gap-6 p-5 sm:p-6">
				<section class="flex flex-col gap-3">
					<div class="text-sm font-semibold text-foreground">Spatial Extent</div>

					{#if spatialExtent.length > 0}
						{#if mapBoundingBox}
							<div class="h-[180px] overflow-hidden rounded-md border">
								<MapSection
									boundingBox={mapBoundingBox}
									showBoundingBox={true}
									boundingBoxColor={[255, 0, 0, 0.3]}
									interactive={false}
									mapMinHeight={180}
									expandFactor={1.5}
								/>
							</div>
						{/if}
					{:else}
						<p class={emptyTextClass}>No spatial extent is available for this resource.</p>
					{/if}
				</section>

				<section class="flex flex-col gap-3">
					<div class="text-sm font-semibold text-foreground">Time Extent</div>

					{#if item.timespans.length > 0}
						<div class="flex flex-col gap-3">
							{#each item.timespans as timespan, index (`timespan-${timespan.start ?? 'start'}-${timespan.end ?? 'end'}-${index}`)}
								<div class="rounded-md border bg-muted/30 p-3">
									<div class="text-sm font-medium text-foreground">{timespan.label}</div>
									<div class="mt-2 space-y-1 text-sm text-muted-foreground">
										<div>Start: {timespan.start ? formatDisplayDate(timespan.start) : 'N/A'}</div>
										<div>End: {timespan.end ? formatDisplayDate(timespan.end) : 'N/A'}</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class={emptyTextClass}>No time extent is available for this resource.</p>
					{/if}
				</section>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<section class="flex flex-col gap-3">
						<div class="text-sm font-semibold text-foreground">Tags</div>

						{#if item.tags.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each item.tags as tag, index (`tag-${tag}-${index}`)}
									<span class={chipClass}>{tag}</span>
								{/each}
							</div>
						{:else}
							<p class={emptyTextClass}>No tags are available for this resource.</p>
						{/if}
					</section>

					<section class="flex flex-col gap-3">
						<div class="text-sm font-semibold text-foreground">Formats</div>

						{#if item.formats.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each item.formats as format (format)}
									<span class={chipClass}>{format}</span>
								{/each}
							</div>
						{:else}
							<p class={emptyTextClass}>No formats are available for this resource.</p>
						{/if}
					</section>
				</div>
			</CardContent>
		</ScrollArea>
	</Card>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Content
		class="item-dialog h-[92vh] min-h-0 w-[80vw] max-w-[80vw] grid-rows-[auto_1fr] overflow-hidden p-0 pb-4 sm:max-w-[80vw]"
	>
		<div class="item-dialog__header-wrap">
			<Dialog.Header class="border-b px-12 py-8 pb-6 pr-24">
				<Dialog.Title class="text-left text-2xl leading-tight">{item.title}</Dialog.Title>
			</Dialog.Header>
		</div>

		<div class="item-dialog__body">
			<div class="item-dialog__content">
				<div
					class="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-rows-1"
				>
					<Card class="h-full min-h-0 overflow-hidden border p-0 shadow-none">
						<CardContent class="flex h-full min-h-0 flex-col gap-6 p-5 sm:p-6">
							<Tabs.Root value="information" class="flex-1 min-h-0 gap-6">
								<div class="flex justify-center">
									<Tabs.List variant="line" class="h-auto border-b bg-transparent px-0">
										{#each tabs as tab}
											<Tabs.Trigger value={tab.value} class="px-4 py-2 text-sm font-medium">
												{tab.label}
											</Tabs.Trigger>
										{/each}
									</Tabs.List>
								</div>

								<Tabs.Content value="information" class="min-h-0 pt-0">
									<ScrollArea class="h-full min-h-0 w-full">
										<div class="pr-4">
											<div
												class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
											>
												<div>
													<span class="font-semibold text-foreground">Resource type:</span>
													{item.resourceType}
												</div>
												<div>
													<span class="font-semibold text-foreground">Published:</span>
													{formatDisplayDate(item.publicationDate)}
												</div>
											</div>

											<div
												class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
											>
												<Card class="border shadow-none gap-3">
													<CardHeader>
														<CardTitle>Description</CardTitle>
													</CardHeader>
													<CardContent class="pt-0">
														<p class="text-sm leading-7 text-foreground">{item.description}</p>
													</CardContent>
												</Card>

												<Card class="border shadow-none gap-3">
													<CardHeader>
														<CardTitle>Additional Information</CardTitle>
													</CardHeader>
													<CardContent class="flex flex-col gap-5 pt-0">
														<section class="flex flex-col gap-3">
															{#if item.credits.length > 0}
																<Accordion.Item
																	title="Credits"
																	subtitle={`${item.credits.length} entr${item.credits.length === 1 ? 'y' : 'ies'}`}
																>
																	<ul
																		class="m-0 list-disc pl-5 text-sm leading-6 text-muted-foreground"
																	>
																		{#each item.credits as credit, index (`credit-${credit}-${index}`)}
																			<li>{credit}</li>
																		{/each}
																	</ul>
																</Accordion.Item>
															{:else}
																<p class={emptyTextClass}>
																	No credits are available for this resource.
																</p>
															{/if}
														</section>

														<section class="flex flex-col gap-3">
															{#if item.licences.length > 0}
																<Accordion.Item
																	title="Licences"
																	subtitle={`${item.licences.length} entr${item.licences.length === 1 ? 'y' : 'ies'}`}
																>
																	<ul
																		class="m-0 list-disc pl-5 text-sm leading-6 text-muted-foreground"
																	>
																		{#each item.licences as licence, index (`licence-${licence}-${index}`)}
																			<li>{licence}</li>
																		{/each}
																	</ul>
																</Accordion.Item>
															{:else}
																<p class={emptyTextClass}>
																	No licence information is available for this resource.
																</p>
															{/if}
														</section>
													</CardContent>
												</Card>
											</div>
										</div>
									</ScrollArea>
								</Tabs.Content>

								<Tabs.Content value="ai-summaries" class="min-h-0 pt-0">
									<ScrollArea class="h-full min-h-0 w-full">
										<div class="pr-4">
											<Card class="border shadow-none">
												<CardContent class="pt-0">
													{#if !selectedArchetypeId}
														<p class={emptyTextClass}>
															Select a role to view the relevant summaries.
														</p>
													{:else if groupedSelectedArchetypeSummaries.length > 0}
														<div class="flex flex-col gap-3">
															{#each groupedSelectedArchetypeSummaries as entry, index (`group-${entry.group}-${index}`)}
																<Button
																	variant="outline"
																	class="h-auto w-full justify-start whitespace-normal px-4 py-4 text-left [overflow-wrap:anywhere]"
																	onclick={() => openSummary(entry.summary)}
																>
																	<span
																		class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3"
																	>
																		<FileText class="size-4 self-center text-muted-foreground" />
																		<span class="flex min-w-0 flex-col gap-1">
																			<span
																				class="text-sm leading-5 font-medium text-foreground break-words"
																			>
																				{formatSummaryGroupLabel(entry.group)}
																			</span>
																		</span>
																	</span>
																</Button>
															{/each}
														</div>
													{:else}
														<p class={emptyTextClass}>
															No summaries are available for the selected archetype yet.
														</p>
													{/if}
												</CardContent>
											</Card>
										</div>
									</ScrollArea>
								</Tabs.Content>

								<Tabs.Content value="supporting-documents" class="min-h-0 pt-0">
									<ScrollArea class="h-full min-h-0 w-full">
										<div class="pr-4">
											<Card class="border shadow-none">
												<CardHeader class="pb-4">
													<CardTitle>Supporting documents</CardTitle>
													<CardDescription>
														This area is reserved for supporting documents.
													</CardDescription>
												</CardHeader>
												<CardContent class="pt-0">
													<p class={emptyTextClass}>
														Supporting documents will be added here later.
													</p>
												</CardContent>
											</Card>
										</div>
									</ScrollArea>
								</Tabs.Content>
							</Tabs.Root>
						</CardContent>
					</Card>

					{@render sideMetadataCard()}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<SummaryDialog
	bind:open={isSummaryDialogOpen}
	summary={activeSummary}
	selectedArchetype={selectedArchetype ?? null}
/>

<style>
	:global(.item-dialog) {
		display: grid;
	}

	.item-dialog__header-wrap {
		position: relative;
	}

	.item-dialog__body {
		min-height: 0;
		overflow: hidden;
		background: hsl(var(--muted) / 0.18);
	}

	.item-dialog__content {
		height: 100%;
		min-height: 0;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	@media (max-width: 768px) {
		.item-dialog__content {
			padding: 1rem;
		}
	}
</style>
