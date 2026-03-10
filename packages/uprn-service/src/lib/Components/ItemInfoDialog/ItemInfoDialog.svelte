<script lang="ts">
	import * as Dialog from '$lib/Components/shadcn/dialog/index.js';
	import ScrollArea from '$lib/Components/shadcn/scroll-area/scroll-area.svelte';
	import * as Tabs from '$lib/Components/shadcn/tabs/index.js';
	import { useFetchMetadataContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
	import { useFetchMetadataTabInfo } from '$lib/Hooks/UseFetchMetadataTabInfo.svelte';
	import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
	import type { IWebMapService } from '$lib/Services/IWebMapService';
	import type { MetadataTab, MetadataTabContentItem, TabGroup } from '$lib/Types/Metadata.types';
	import { metadataRenderers } from './metadataRenderers';

	type ContentHook = ReturnType<typeof useFetchMetadataContent>;

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

	const layer: __esri.Layer | __esri.Sublayer | null = $derived.by(() => {
		return activeLayerId ? webmapService.getLayerById(activeLayerId) || null : null;
	});

	const nodeConfig = $derived.by(() => {
		if (!activeLayerId) {
			return null;
		}
		return nodeConfigProvider.getConfig(activeLayerId);
	});

	const useTabInfo = $derived.by(() => {
		if (!nodeConfig?.metadataTabInfoUrl) {
			return null;
		}

		return useFetchMetadataTabInfo(nodeConfig.metadataTabInfoUrl);
	});

	/** The tab groups preserving their grouping structure. */
	const tabGroups: TabGroup[] | null = $derived.by(() => {
		if (!useTabInfo?.content) {
			return null;
		}

		if (useTabInfo.content.tabGroups && useTabInfo.content.tabGroups.length > 0) {
			return useTabInfo.content.tabGroups;
		}

		return null;
	});

	/** The flattened tabs (used for content rendering and lookup). */
	const flattenedTabs: MetadataTab[] | null = $derived.by(() => {
		if (!tabGroups) {
			return null;
		}

		return tabGroups.flatMap((group) => group.tabs);
	});

	let activeTabId: string | null = $state(null);
	let contentHooksByKey = $state<Record<string, ContentHook>>({});
	let previousLayerId: string | null = $state(null);

	function createContentKey(
		tabTitle: string,
		index: number,
		contentItem: MetadataTabContentItem
	): string {
		switch (contentItem.type) {
			case 'arcgisInfo':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}`;
			case 'text':
			case 'disclaimer':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}::${contentItem.value}`;
			case 'xmlKeyInfo':
			case 'image':
			case 'xml':
			case 'md':
			case 'docx':
			case 'pdf':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}::${contentItem.source}`;
			case 'slideshow':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}::${contentItem.source.join('|')}`;
		}

		throw new Error('Unknown metadata tab content type');
	}

	function getHook(tabTitle: string, index: number, contentItem: MetadataTabContentItem) {
		const key = createContentKey(tabTitle, index, contentItem);
		return contentHooksByKey[key] || null;
	}

	function getSelectedTab() {
		if (!flattenedTabs?.length) {
			return null;
		}

		if (!activeTabId) {
			return flattenedTabs[0] ?? null;
		}

		return flattenedTabs.find((tab) => tab.title === activeTabId) || null;
	}

	$effect(() => {
		if (previousLayerId !== activeLayerId) {
			for (const hook of Object.values(contentHooksByKey)) {
				hook.clear();
			}

			contentHooksByKey = {};
			activeTabId = null;
			previousLayerId = activeLayerId;
		}
	});

	$effect(() => {
		if (useTabInfo && !useTabInfo.content) {
			console.log(
				'[ItemInfoDialog] Fetching metadata tab info from URL:',
				nodeConfig?.metadataTabInfoUrl
			);

			console.log(
				'[ItemInfoDialog] Checking if we need to fetch tab info. useTabInfo:',
				useTabInfo
			);
			useTabInfo.fetch();
		}
	});

	$effect(() => {
		const selectedTab = getSelectedTab();
		if (!selectedTab) {
			return;
		}

		for (const [index, contentItem] of selectedTab.content.entries()) {
			const key = createContentKey(selectedTab.title, index, contentItem);
			let hook = contentHooksByKey[key];

			if (!hook) {
				hook = useFetchMetadataContent(contentItem);
				contentHooksByKey[key] = hook;
			}

			if (!hook.content && !hook.error && !hook.isLoading) {
				hook.fetch();
			}
		}
	});

	function formatHookError(value: unknown) {
		if (value instanceof Error) {
			return value.message;
		}

		return String(value);
	}

	function getRenderer(type: MetadataTabContentItem['type']) {
		return metadataRenderers[type] ?? null;
	}

	function isMatchingResolvedType(
		content: MetadataResolvedContent,
		contentItem: MetadataTabContentItem
	) {
		return content.type === contentItem.type;
	}
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
	<Dialog.Content
		class="grid h-[80vh] min-h-0 min-w-[850px] grid-rows-[auto_1fr] overflow-hidden"
		onInteractOutside={(e) => {
			const overlay = document.querySelector('.svelte-lightbox-overlay');
			if (overlay && overlay.contains(e.target as Node)) e.preventDefault();
		}}
	>
		<Dialog.Header>
			<Dialog.Title>{nodeConfig?.displayName ?? 'Name not found'}</Dialog.Title>
		</Dialog.Header>
		{#if useTabInfo && useTabInfo.isLoading}
			<div class="flex-1 min-h-0 overflow-y-auto pr-4">
				<div class="flex flex-col gap-4">
					<p class="mx-auto max-w-prose text-center text-sm italic text-muted-foreground">
						Loading...
					</p>
				</div>
			</div>
		{:else if useTabInfo && useTabInfo.error}
			<div class="flex-1 min-h-0 overflow-y-auto pr-4">
				<div class="flex flex-col gap-4">
					<p class="mx-auto max-w-prose text-center text-sm italic text-destructive">
						Error loading metadata information: {useTabInfo.error}
					</p>
				</div>
			</div>
		{:else if tabGroups && tabGroups.length > 0 && flattenedTabs && flattenedTabs.length > 0}
			<Tabs.Root
				class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
				value={activeTabId ?? flattenedTabs[0]?.title}
				onValueChange={(value) => (activeTabId = value)}
			>
				<div class="flex shrink-0 flex-wrap items-end justify-center gap-x-6 gap-y-2 pb-2">
					{#each tabGroups as group}
						<div class="flex flex-col items-center gap-1">
							{#if tabGroups.length > 1}
								<span class="text-xs font-medium text-muted-foreground">{group.title}</span>
							{/if}
							<Tabs.List>
								{#each group.tabs as tab}
									<Tabs.Trigger value={tab.title}>{tab.title}</Tabs.Trigger>
								{/each}
							</Tabs.List>
						</div>
					{/each}
				</div>
				{#each flattenedTabs as tab}
					<Tabs.Content value={tab.title} class="flex-1 min-h-0 overflow-hidden">
						<ScrollArea class="h-full w-full" type="auto">
							<div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
								{#each tab.content as contentItem, index}
									{@const contentHook = getHook(tab.title, index, contentItem)}
									{@const Renderer = getRenderer(contentItem.type)}
									{#if contentHook?.isLoading}
										<p class="w-full text-center text-sm italic text-muted-foreground">
											Loading content...
										</p>
									{:else if contentHook?.error}
										<p class="w-full text-center text-sm italic text-destructive">
											Error loading content: {formatHookError(contentHook.error)}
										</p>
									{:else if contentHook?.content && Renderer}
										{#if isMatchingResolvedType(contentHook.content, contentItem)}
											<Renderer content={contentHook.content} {index} {layer} />
										{:else}
											<p class="w-full text-center text-sm italic text-muted-foreground">
												Resolved content type mismatch: {contentHook.content.type}
											</p>
										{/if}
									{:else}
										<p class="w-full text-center text-sm italic text-muted-foreground">
											Unsupported content type: {contentItem.type}
										</p>
									{/if}
								{/each}
							</div>
						</ScrollArea>
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
