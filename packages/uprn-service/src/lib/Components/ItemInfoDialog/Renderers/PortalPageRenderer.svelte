<script lang="ts">
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { Card, CardContent, CardHeader } from '$lib/Components/shadcn/card';
	import { ScrollArea } from '$lib/Components/shadcn/scroll-area';
	import { Button } from '$lib/Components/shadcn/button';
	import * as Tooltip from '$lib/Components/shadcn/tooltip';
	import { ExternalLink } from '@lucide/svelte';

	type Props = {
		content: Extract<MetadataResolvedContent, { type: 'portalPage' }>;
	};

	let { content }: Props = $props();

	type PortalMetadata = {
		id: string | null;
		title: string | null;
		description: string | null;
		organisationName: string | null;
		creationDate: string | null;
		publicationDate: string | null;
		purpose: string | null;
		credit: string | null;
		lineage: string | null;
		keywords: string[];
		tags: string[];
		categories: string[];
		licenseInfo: string | null;
		sourceUrl: string | null;
		contactEmail: string | null;
		pointOfContactOrganisation: string | null;
		pointOfContactEmail: string | null;
	};

	type JsonRecord = Record<string, unknown>;

	function asRecord(value: unknown): JsonRecord | null {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
		return value as JsonRecord;
	}

	function normalizeString(value: unknown): string | null {
		if (typeof value === 'string') {
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : null;
		}

		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}

		return null;
	}

	function normalizeDateValue(value: unknown): string | null {
		if (typeof value === 'number') {
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? null : date.toISOString();
		}

		return normalizeString(value);
	}

	function findFirstByKeys(root: unknown, keys: string[]): string | null {
		const queue: unknown[] = [root];
		const visited = new Set<object>();

		while (queue.length > 0) {
			const node = queue.shift();

			if (Array.isArray(node)) {
				for (const item of node) {
					queue.push(item);
				}
				continue;
			}

			const record = asRecord(node);
			if (!record) continue;
			if (visited.has(record)) continue;
			visited.add(record);

			for (const key of keys) {
				if (!(key in record)) continue;

				const value = normalizeString(record[key]);
				if (value) return value;
			}

			for (const value of Object.values(record)) {
				queue.push(value);
			}
		}

		return null;
	}

	function findFirstDateByKeys(root: unknown, keys: string[]): string | null {
		const queue: unknown[] = [root];
		const visited = new Set<object>();

		while (queue.length > 0) {
			const node = queue.shift();

			if (Array.isArray(node)) {
				for (const item of node) {
					queue.push(item);
				}
				continue;
			}

			const record = asRecord(node);
			if (!record) continue;
			if (visited.has(record)) continue;
			visited.add(record);

			for (const key of keys) {
				if (!(key in record)) continue;

				const value = normalizeDateValue(record[key]);
				if (value) return value;
			}

			for (const value of Object.values(record)) {
				queue.push(value);
			}
		}

		return null;
	}

	function collectStringsByKeys(root: unknown, keys: string[]): string[] {
		const queue: unknown[] = [root];
		const visited = new Set<object>();
		const values: string[] = [];

		while (queue.length > 0) {
			const node = queue.shift();

			if (Array.isArray(node)) {
				for (const item of node) {
					queue.push(item);
				}
				continue;
			}

			const record = asRecord(node);
			if (!record) continue;
			if (visited.has(record)) continue;
			visited.add(record);

			for (const key of keys) {
				if (!(key in record)) continue;

				const keyValue = record[key];
				if (Array.isArray(keyValue)) {
					for (const item of keyValue) {
						const value = normalizeString(item);
						if (value) values.push(value);
					}
				} else {
					const value = normalizeString(keyValue);
					if (value) values.push(value);
				}
			}

			for (const value of Object.values(record)) {
				queue.push(value);
			}
		}

		return [...new Set(values)];
	}

	function parsePortalJson(text: string): unknown | null {
		try {
			return JSON.parse(text);
		} catch {
			return null;
		}
	}

	function normalizeCategoryLabel(value: string): string {
		if (!value.includes('/')) return value;
		const parts = value.split('/').filter(Boolean);
		return parts.at(-1) ?? value;
	}

	const metadata = $derived.by(() => {
		const parsed = parsePortalJson(content.text);

		if (!parsed) {
			return {
				id: null,
				title: null,
				description: null,
				organisationName: null,
				creationDate: null,
				publicationDate: null,
				purpose: null,
				credit: null,
				lineage: null,
				keywords: [],
				tags: [],
				categories: [],
				licenseInfo: null,
				sourceUrl: null,
				contactEmail: null,
				pointOfContactOrganisation: null,
				pointOfContactEmail: null
			} satisfies PortalMetadata;
		}

		return {
			id: findFirstByKeys(parsed, ['id', 'itemId']),
			title: findFirstByKeys(parsed, ['title', 'name', 'datasetTitle']),
			description: findFirstByKeys(parsed, ['abstract', 'description', 'snippet', 'summary']),
			organisationName: findFirstByKeys(parsed, [
				'organisationName',
				'organisation',
				'organization',
				'ownerOrg',
				'owner'
			]),
			creationDate: findFirstDateByKeys(parsed, ['creationDate', 'created', 'dateCreated']),
			publicationDate: findFirstDateByKeys(parsed, [
				'publicationDate',
				'modified',
				'datePublished',
				'dateUpdated'
			]),
			purpose: findFirstByKeys(parsed, ['purpose', 'objective', 'snippet']),
			credit: findFirstByKeys(parsed, ['credit', 'credits', 'accessInformation']),
			lineage: findFirstByKeys(parsed, ['lineage', 'provenance', 'methodology']),
			keywords: collectStringsByKeys(parsed, [
				'keywords',
				'keyword',
				'themeKeywords',
				'typeKeywords'
			]),
			tags: collectStringsByKeys(parsed, ['tags', 'tag']),
			categories: collectStringsByKeys(parsed, ['categories', 'category']).map(
				normalizeCategoryLabel
			),
			licenseInfo: findFirstByKeys(parsed, ['licenseInfo', 'license', 'licence']),
			sourceUrl: findFirstByKeys(parsed, ['url', 'privateUrl', 'itemUrl']),
			contactEmail: findFirstByKeys(parsed, ['contactEmail', 'email']),
			pointOfContactOrganisation: findFirstByKeys(parsed, [
				'pointOfContactOrganisation',
				'contactOrganization',
				'contactOrganisation'
			]),
			pointOfContactEmail: findFirstByKeys(parsed, ['pointOfContactEmail', 'contactEmail', 'email'])
		} satisfies PortalMetadata;
	});

	function formatDate(value: string | null): string {
		if (!value) return 'Not provided';

		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
	}

	function containsHtml(value: string | null): boolean {
		if (!value) return false;
		return /<\s*\/?[a-z][^>]*>/i.test(value);
	}

	function openSourceLink(url: string) {
		const baseUrl = url.split('/server')[0];
		const portalUrl = `${baseUrl}/portal/home/item.html?id=${metadata.id}`;

		window.open(portalUrl, '_blank', 'noopener,noreferrer');
	}
</script>

<Card class="w-full h-full relative p-2">
	<div class="absolute top-4 right-4 z-10 opacity-60">
		{#if metadata.sourceUrl}
			<Tooltip.Provider disableHoverableContent>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-pointer">
						<Button
							variant="outline"
							size="sm"
							aria-label="Open source page"
							onclick={() => metadata.sourceUrl && openSourceLink(metadata.sourceUrl)}
						>
							<ExternalLink />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="top">Open source</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
	</div>

	<ScrollArea class="h-full w-full">
		<CardHeader class="space-y-3 pr-14" />

		<CardContent class="space-y-6">
			{#if metadata.purpose}
				<section class="rounded-lg border p-4 text-sm text-muted-foreground">
					<span class="font-semibold text-foreground">Purpose:</span>
					{' '}{metadata.purpose}
				</section>
			{/if}

			<!-- <div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Date</div>
					<div class="mt-1 space-y-1 text-sm">
						{#if metadata.creationDate}
							<div class="flex items-baseline gap-1">
								{formatDate(metadata.creationDate)}
								<p class="text-xs text-muted-foreground">(Creation)</p>
							</div>
						{/if}
						{#if metadata.publicationDate}
							<div class="flex items-baseline gap-1">
								{formatDate(metadata.publicationDate)}
								<p class="text-xs text-muted-foreground">(Publication)</p>
							</div>
						{/if}
					</div>
				</div>

				<div class="rounded-lg border p-4">
					<div class="text-sm font-medium text-muted-foreground">Organisation</div>
					<div class="mt-1 text-sm">{metadata.organisationName ?? 'Not provided'}</div>
				</div>
			</div> -->

			<section class="space-y-2">
				<h2 class="text-base font-semibold">Description</h2>
				{#if metadata.description && containsHtml(metadata.description)}
					<article class="prose-info-markdown text-sm text-muted-foreground max-w-none">
						{@html metadata.description}
					</article>
				{:else}
					<p class="text-sm leading-6 text-muted-foreground">
						{metadata.description ?? 'No description available.'}
					</p>
				{/if}
			</section>

			<!-- <section class="space-y-3">
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
			</section> -->

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

			{#if metadata.licenseInfo}
				<section class="space-y-2">
					<h2 class="text-base font-semibold">License</h2>
					<div class="rounded-lg border p-4">
						{#if containsHtml(metadata.licenseInfo)}
							<article class="prose prose-info-markdown text-sm text-muted-foreground max-w-none">
								{@html metadata.licenseInfo}
							</article>
						{:else}
							<p class="text-sm leading-6 text-muted-foreground">
								{metadata.licenseInfo}
							</p>
						{/if}
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

				<!-- {#if metadata.keywords.length > 0}
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
				{/if} -->

				{#if metadata.categories.length > 0}
					<div class="space-y-3">
						<h2 class="text-base font-semibold">Categories</h2>

						<div class="flex flex-wrap gap-2">
							{#each metadata.categories as category}
								<span
									class="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{category}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if metadata.tags.length > 0}
					<div class="space-y-3">
						<h2 class="text-base font-semibold">Tags</h2>

						<div class="flex flex-wrap gap-2">
							{#each metadata.tags as tag}
								<span
									class="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{tag}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		</CardContent>
	</ScrollArea>
</Card>
