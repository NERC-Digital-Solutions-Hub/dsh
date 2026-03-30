<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog';
	import type { ArchetypeDefinition } from '$lib/types/api.types';
	import type { SummaryContentItem, SummaryResolvedContent } from '$lib/types/summary.types';
	import { formatSummaryGroupLabel, type CatalogueArchetypeLink } from '$lib/utils/catalogue-ui';
	import { summaryRenderers } from './summary-renderers';
	import { useFetchSummaryContent } from './useFetchSummaryContent.svelte';

	type ContentHook = ReturnType<typeof useFetchSummaryContent>;

	type Props = {
		summary?: CatalogueArchetypeLink | null;
		selectedArchetype?: ArchetypeDefinition | null;
		open?: boolean;
	};

	let { summary = null, selectedArchetype = null, open = $bindable(false) }: Props = $props();

	const contentItem = $derived.by<SummaryContentItem | null>(() => {
		if (!summary) {
			return null;
		}

		return {
			type: summary.contentType,
			source: summary.url
		};
	});

	const contentKey = $derived(contentItem ? `${contentItem.type}::${contentItem.source}` : null);

	let contentHook = $state<ContentHook | null>(null);
	let previousContentKey = $state<string | null>(null);

	$effect(() => {
		if (contentKey === previousContentKey) {
			return;
		}

		contentHook?.clear();
		contentHook = contentItem ? useFetchSummaryContent(contentItem) : null;
		previousContentKey = contentKey;
	});

	$effect(() => {
		if (!open || !contentHook) {
			return;
		}

		if (!contentHook.content && !contentHook.error && !contentHook.isLoading) {
			void contentHook.fetch();
		}
	});

	function formatHookError(value: unknown) {
		if (value instanceof Error) {
			return value.message;
		}

		return String(value);
	}

	function getRenderer(type: SummaryContentItem['type']) {
		return summaryRenderers[type] ?? null;
	}

	function isMatchingResolvedType(
		content: SummaryResolvedContent,
		item: SummaryContentItem
	): boolean {
		return content.type === item.type;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="grid h-[85vh] min-h-0 min-w-[85vw] max-w-[85vw] grid-rows-[auto_1fr] overflow-hidden p-0"
	>
		<Dialog.Header class="border-b px-6 py-5 pr-16">
			<Dialog.Title class="text-left text-xl leading-tight">
				{formatSummaryGroupLabel(summary?.group)}
			</Dialog.Title>
		</Dialog.Header>

		<div class="flex min-h-0 flex-col gap-2 px-6 pb-5">
			<div class="min-h-0 flex-1">
				{#if !summary || !contentItem}
					<p class="text-sm italic text-muted-foreground">No summary selected.</p>
				{:else if contentHook?.isLoading}
					<p class="text-sm italic text-muted-foreground">Loading summary...</p>
				{:else if contentHook?.error}
					<p class="text-sm italic text-destructive">
						Error loading summary: {formatHookError(contentHook.error)}
					</p>
				{:else if contentHook?.content}
					{@const Renderer = getRenderer(contentItem.type)}
					{#if Renderer && isMatchingResolvedType(contentHook.content, contentItem)}
						<Renderer content={contentHook.content} />
					{:else}
						<p class="text-sm italic text-muted-foreground">
							Unsupported summary content type: {contentItem.type}
						</p>
					{/if}
				{:else}
					<p class="text-sm italic text-muted-foreground">Summary content is not available.</p>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
