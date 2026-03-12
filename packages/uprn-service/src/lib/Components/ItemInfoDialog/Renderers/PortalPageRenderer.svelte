<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/Components/shadcn/card';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'portalPage' }>;
	};

	let { content }: Props = $props();

	const metadata = $derived({
		title: '',
		abstract: '',
		organisationName: '',
		creationDate: '',
		publicationDate: '',
		purpose: '',
		credit: '',
		lineage: '',
		keywords: '',
		contactEmail: '',
		pointOfContactOrganisation: '',
		pointOfContactEmail: ''
	});

	function formatDate(value: string | null): string {
		if (!value) return 'Not provided';

		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
	}
</script>

<Card class="w-full h-full">
	<ScrollArea class="h-full w-full">
		<CardHeader class="space-y-3">
			<CardTitle class="text-2xl leading-tight">
				{metadata.title ?? 'Untitled dataset'}
			</CardTitle>

			{#if metadata.purpose}
				<CardDescription class="text-sm text-muted-foreground">
					{metadata.purpose}
				</CardDescription>
			{/if}
		</CardHeader>

		<CardContent class="space-y-6">
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Date</div>
					{#if metadata.creationDate}
						<div class="inline-flex gap-1 mt-1 text-sm">
							{formatDate(metadata.creationDate)}
							<p class="text-xs text-muted-foreground">(Creation)</p>
						</div>
					{/if}
					{#if metadata.publicationDate}
						<div class="inline-flex gap-1 mt-1 text-sm">
							{formatDate(metadata.publicationDate)}
							<p class="text-xs text-muted-foreground">(Publication)</p>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Organisation</div>
					<div class="mt-1 text-sm">{metadata.organisationName ?? 'Not provided'}</div>
				</div>
			</div>

			<section class="space-y-2">
				<h2 class="text-base font-semibold">Abstract</h2>
				<p class="text-sm leading-6 text-muted-foreground">
					{metadata.abstract ?? 'No abstract available.'}
				</p>
			</section>

			<section class="space-y-3">
				<h2 class="text-base font-semibold">Contact</h2>

				<div class="rounded-lg border p-4 space-y-2 text-sm">
					<div>
						<span class="font-medium">Point of contact: </span>
						{metadata.pointOfContactOrganisation ?? metadata.organisationName ?? 'Not provided'}
					</div>

					<div>
						<span class="font-medium">Email: </span>
						{#if metadata.pointOfContactEmail ?? metadata.contactEmail}
							<a
								class="text-primary underline underline-offset-4"
								href={`mailto:${metadata.pointOfContactEmail ?? metadata.contactEmail}`}
							>
								{metadata.pointOfContactEmail ?? metadata.contactEmail}
							</a>
						{:else}
							<span>Not provided</span>
						{/if}
					</div>
				</div>
			</section>

			{#if metadata.lineage}
				<section class="space-y-2">
					<h2 class="text-base font-semibold">Lineage</h2>
					<div class="rounded-lg border p-4">
						<p class="text-sm leading-6 text-muted-foreground">
							{metadata.lineage}
						</p>
					</div>
				</section>
			{/if}

			<section class="space-y-4 border-t pt-6">
				{#if metadata.credit}
					<div class="rounded-lg bg-muted/40 p-4">
						<h2 class="text-base font-semibold">Credits</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							{metadata.credit}
						</p>
					</div>
				{/if}

				{#if metadata.keywords.length > 0}
					<div class="space-y-3">
						<h2 class="text-base font-semibold">Keywords</h2>

						<div class="flex flex-wrap gap-2">
							{#each metadata.keywords as keyword}
								<span
									class="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{keyword}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		</CardContent>
	</ScrollArea>
</Card>
