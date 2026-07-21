<script lang="ts">
	import { onDestroy } from 'svelte';

	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tabs from '$lib/Components/shadcn/tabs/index.js';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { IWebMapService } from '$lib/Services/IWebMapService';
	import { MetadataContentController } from '$lib/Stores/MetadataContentController.svelte';
	import type { MetadataTab, MetadataTabContentItem } from '$lib/Types/Metadata.types';

	import LazyMetadataRenderer from './LazyMetadataRenderer.svelte';

	type Props = {
		webmapService: IWebMapService;
		nodeConfigProvider: INodeConfigProvider;
		isOpen: boolean;
		activeLayerId: string | null;
	};

	let {
		webmapService,
		nodeConfigProvider,
		isOpen = $bindable(),
		activeLayerId = $bindable()
	}: Props = $props();

	const controller = new MetadataContentController();
	const layer = $derived(activeLayerId ? webmapService.getLayerById(activeLayerId) : null);
	const nodeConfig = $derived(activeLayerId ? nodeConfigProvider.getConfig(activeLayerId) : null);
	const selectedTab = $derived(
		controller.flattenedTabs.find((tab) => tab.title === controller.activeTabId) ??
			controller.flattenedTabs[0] ??
			null
	);

	$effect(() => {
		void controller.loadTabs(activeLayerId, nodeConfig?.metadataTabInfoUrl ?? null);
	});

	$effect(() => {
		void controller.ensureTab(selectedTab);
	});

	onDestroy(() => controller.destroy());

	type ContentPlacement = 'fixedTop' | 'scroll';

	function getTabContentEntries(tab: MetadataTab, placement: ContentPlacement) {
		return tab.content
			.map((contentItem, index) => ({ contentItem, index }))
			.filter(({ contentItem }) =>
				placement === 'fixedTop'
					? contentItem.type === 'disclaimer'
					: contentItem.type !== 'disclaimer'
			);
	}

	function formatError(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}
</script>

{#snippet renderContent(tabTitle: string, contentItem: MetadataTabContentItem, index: number)}
	{@const state = controller.getContentState(tabTitle, index, contentItem)}
	{#if state?.isLoading}
		<p class="w-full text-center text-sm italic text-muted-foreground">Loading content...</p>
	{:else if state?.error}
		<p class="w-full text-center text-sm italic text-destructive">
			Error loading content: {formatError(state.error)}
		</p>
	{:else if state?.content}
		<LazyMetadataRenderer type={contentItem.type} content={state.content} {index} {layer} />
	{/if}
{/snippet}

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
	<Dialog.Content
		class="grid h-[90%] min-h-0 min-w-[70%] grid-rows-[auto_1fr] overflow-hidden"
		onInteractOutside={(event) => {
			const overlay = document.querySelector('.svelte-lightbox-overlay');
			if (overlay?.contains(event.target as Node)) event.preventDefault();
		}}
	>
		<Dialog.Header>
			<Dialog.Title>{nodeConfig?.displayName ?? 'Name not found'}</Dialog.Title>
		</Dialog.Header>

		{#if controller.isLoadingTabs}
			<p class="mx-auto max-w-prose text-center text-sm italic text-muted-foreground">Loading...</p>
		{:else if controller.tabsError}
			<p class="mx-auto max-w-prose text-center text-sm italic text-destructive">
				Error loading metadata information: {formatError(controller.tabsError)}
			</p>
		{:else if controller.tabGroups.length > 0 && controller.flattenedTabs.length > 0}
			<Tabs.Root
				class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
				value={controller.activeTabId ?? controller.flattenedTabs[0]?.title}
				onValueChange={(value) => (controller.activeTabId = value)}
			>
				<div class="flex shrink-0 flex-wrap items-end justify-center gap-x-6 gap-y-2 pb-2">
					{#each controller.tabGroups as group (group.title)}
						<div class="flex flex-col items-center gap-1">
							{#if controller.tabGroups.length > 1}
								<span class="text-xs font-medium text-muted-foreground">{group.title}</span>
							{/if}
							<Tabs.List>
								{#each group.tabs as tab (tab.title)}
									<Tabs.Trigger value={tab.title}>{tab.title}</Tabs.Trigger>
								{/each}
							</Tabs.List>
						</div>
					{/each}
				</div>

				{#each controller.flattenedTabs as tab (tab.title)}
					<Tabs.Content value={tab.title} class="flex min-h-0 flex-1 flex-col px-6">
						{@const fixedTopEntries = getTabContentEntries(tab, 'fixedTop')}
						{@const scrollEntries = getTabContentEntries(tab, 'scroll')}

						{#if fixedTopEntries.length > 0}
							<div class="shrink-0 border-b pb-3">
								<div class="flex flex-col items-center gap-2 pt-1">
									{#each fixedTopEntries as entry (entry.index)}
										{@render renderContent(tab.title, entry.contentItem, entry.index)}
									{/each}
								</div>
							</div>
						{/if}

						<div class="min-h-0 flex-1 overflow-y-auto">
							<ScrollArea class="h-full w-full">
								<div class="flex flex-col items-center gap-4 py-2">
									{#each scrollEntries as entry (entry.index)}
										{@render renderContent(tab.title, entry.contentItem, entry.index)}
									{/each}
								</div>
							</ScrollArea>
						</div>
					</Tabs.Content>
				{/each}
			</Tabs.Root>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.svelte-lightbox-overlay) {
		position: fixed;
		inset: 0;
		z-index: 9999 !important;
		pointer-events: auto;
	}
	:global(.svelte-lightbox-main) {
		position: fixed;
		inset: 0;
		z-index: 10000 !important;
		pointer-events: auto;
	}
</style>
