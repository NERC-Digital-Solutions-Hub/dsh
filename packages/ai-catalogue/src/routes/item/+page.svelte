<script lang="ts">
	import { page } from '$app/state';
	import { asset } from '$app/paths';
	import ItemDetail from '$lib/components/item-detail/item-detail.svelte';
	import { Button } from '$lib/components/shadcn/button';
	import * as Alert from '$lib/components/shadcn/alert/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/shadcn/card';
	import { Skeleton } from '$lib/components/shadcn/skeleton';
	import { Separator } from '$lib/components/shadcn/separator';
	import { useQueryMetadata } from '$lib';
	import type { ApiRequestError } from '$lib/hooks/_api-request';
	import type { QueryResponsePayload } from '$lib/types/api.types';
	import type { CatalogueConfig } from '$lib/types/config';
	import { adaptQueryRecordToDetail } from '$lib/utils/catalogue-ui';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let metadataQuery = $state<ReturnType<typeof useQueryMetadata> | null>(null);
	let configError = $state<unknown>(null);
	let isInitialising = $state(true);
	let currentRequestId = 0;

	const itemId = $derived(page.url.searchParams.get('id')?.trim() ?? '');
	const apiRecords = $derived(metadataQuery?.content?.payload ?? []);
	const selectedRecord = $derived(findRecordByIdentifier(apiRecords, itemId));
	const itemDetail = $derived(selectedRecord ? adaptQueryRecordToDetail(selectedRecord) : null);
	const itemErrorMessage = $derived(getApiErrorMessage(metadataQuery?.error ?? configError));
	const isLoading = $derived(isInitialising || Boolean(metadataQuery?.isLoading));

	$effect(() => {
		void loadItem(itemId);
	});

	async function loadItem(nextItemId: string) {
		const requestId = ++currentRequestId;

		if (!nextItemId) {
			isInitialising = false;
			return;
		}

		try {
			if (!metadataQuery) {
				const config = await fetchConfig();

				if (requestId !== currentRequestId) {
					return;
				}

				const endpoint = config.catalogueApiUrl.replace(/\/+$/, '');
				metadataQuery = useQueryMetadata(`${endpoint}/metadata/query`);
			}

			configError = null;
			isInitialising = true;

			await metadataQuery.fetch({
				searchTerm: nextItemId
			});
		} catch (error) {
			if (requestId !== currentRequestId) {
				return;
			}

			configError = error;
		} finally {
			if (requestId === currentRequestId) {
				isInitialising = false;
			}
		}
	}

	async function fetchConfig(): Promise<CatalogueConfig> {
		const path = asset('/config/catalogues/ai/api.json');
		const response = await fetch(path);

		if (!response.ok) {
			throw new Error(`Unable to load catalogue configuration: ${response.statusText}`);
		}

		return (await response.json()) as CatalogueConfig;
	}

	function findRecordByIdentifier(records: QueryResponsePayload[], fileIdentifier: string) {
		const normalisedId = fileIdentifier.trim().toLowerCase();

		if (!normalisedId) {
			return undefined;
		}

		return records.find(
			(record) => record.fileIdentifier?.trim().toLowerCase() === normalisedId
		);
	}

	function getApiErrorMessage(error: unknown) {
		if (!error) {
			return undefined;
		}

		const apiError = error as Partial<ApiRequestError>;
		const validationProblem = apiError.validationProblem;

		if (validationProblem?.errors) {
			return Object.values(validationProblem.errors)
				.flat()
				.filter(Boolean)
				.join(' ');
		}

		return (
			validationProblem?.detail ||
			validationProblem?.title ||
			apiError.bodyText ||
			apiError.message ||
			'Something went wrong while loading this item.'
		);
	}
</script>

<div class="item-page">
	<div class="item-page__inner">
		<div class="item-page__toolbar">
			<Button href="/" variant="ghost" class="gap-2">
				<ArrowLeftIcon class="h-4 w-4" />
				Back to search
			</Button>
		</div>

		{#if !itemId}
			<Alert.Root variant="destructive">
				<AlertCircleIcon />
				<Alert.Title>Missing item identifier</Alert.Title>
				<Alert.Description>
					Open this page with an item id, for example `/item?id=example-file-identifier`.
				</Alert.Description>
			</Alert.Root>
		{:else if isLoading}
			<div class="loading-stack">
				<Card>
					<CardHeader class="space-y-3">
						<Skeleton class="h-4 w-28" />
						<Skeleton class="h-10 w-2/3" />
						<Skeleton class="h-20 w-full" />
					</CardHeader>
					<CardContent class="loading-grid">
						{#each Array.from({ length: 6 }) as _, index (`summary-${index}`)}
							<Skeleton class="h-24 w-full rounded-xl" />
						{/each}
					</CardContent>
				</Card>

				<div class="loading-detail-grid">
					<Skeleton class="h-96 w-full rounded-xl" />
					<Skeleton class="h-80 w-full rounded-xl" />
				</div>
			</div>
		{:else if itemErrorMessage}
			<Alert.Root variant="destructive">
				<AlertCircleIcon />
				<Alert.Title>Unable to load item</Alert.Title>
				<Alert.Description>{itemErrorMessage}</Alert.Description>
			</Alert.Root>
		{:else if itemDetail}
			<ItemDetail item={itemDetail} />
		{:else}
			<Card>
				<CardHeader>
					<CardTitle>Item not found</CardTitle>
					<CardDescription>
						We could not find an item with the identifier `{itemId}`.
					</CardDescription>
				</CardHeader>
				<CardContent class="not-found-actions">
					<p class="not-found-copy">
						Try returning to the catalogue and opening the item again from the search results.
					</p>
					<Separator />
					<Button href="/" variant="outline">Return to catalogue</Button>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<style>
	.item-page {
		flex: 1;
		padding: 1.5rem;
		background:
			linear-gradient(180deg, hsl(var(--muted) / 0.3), transparent 220px),
			hsl(var(--background));
	}

	.item-page__inner {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.item-page__toolbar {
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}

	.loading-stack {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.loading-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.loading-detail-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
		gap: 1.5rem;
	}

	.not-found-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.not-found-copy {
		margin: 0;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	@media (max-width: 900px) {
		.loading-grid,
		.loading-detail-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.item-page {
			padding: 1rem;
		}
	}
</style>
