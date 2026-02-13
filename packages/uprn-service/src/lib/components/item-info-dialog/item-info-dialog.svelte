<script lang="ts">
	import esriRequest from '@arcgis/core/request.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import type { IWebMapService } from '$lib/services/IWebMapService';
	import type { INodeConfigProvider } from '$lib/services/INodeConfigProvider';
	import { useFetchMetadataTabInfo } from '$lib/hooks/use-fetch-metadata-tab-info.svelte';
	import { useFetchMetadataContent } from '$lib/hooks/use-fetch-metadata-content.svelte';
	import type { MetadataTab, MetadataTabContentItem } from '$lib/types/metadata';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import * as Carousel from '$lib/components/shadcn/carousel/index.js';
	import ScrollArea from '$lib/components/shadcn/scroll-area/scroll-area.svelte';
	import * as Card from '$lib/components/shadcn/card/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Lightbox, LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';
	import XmlTree from '$lib/components/xml-tree/xml-tree.svelte';
	import { ArrowDownToLine } from '@lucide/svelte';
	import CopyToClipboardButton from '$lib/components/copy-to-clipboard-button/copy-to-clipboard-button.svelte';

	type ContentHook = ReturnType<typeof useFetchMetadataContent>;
	type LayerDef = {
		name?: string;
		description?: string;
		copyrightText?: string;
	};

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

	let hasLayerDef: boolean | null = $state(null);
	let layerDef: LayerDef | null = $state(null);
	let layerSummary: string | null = $state(null);
	let layerDescription: string | null = $state(null);
	let layerCredits: string | null = $state(null);

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
		console.log('[ItemInfoDialog] Computing tabInfo for activeLayerId:', activeLayerId);
		if (!nodeConfig?.metadataTabInfoUrl) {
			console.log('[ItemInfoDialog] No metadataTabInfoUrl found for nodeConfig:', nodeConfig);
			return null;
		}

		console.log(
			'[ItemInfoDialog] Found metadataTabInfoUrl:',
			nodeConfig.metadataTabInfoUrl,
			'for activeLayerId:',
			activeLayerId
		);
		return useFetchMetadataTabInfo(nodeConfig.metadataTabInfoUrl);
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
			case 'text':
			case 'image':
			case 'xml':
			case 'docx':
			case 'pdf':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}::${contentItem.link}`;
			case 'slideshow':
				return `${activeLayerId ?? 'none'}::${tabTitle}::${index}::${contentItem.type}::${contentItem.links.join('|')}`;
		}

		throw new Error('Unknown metadata tab content type');
	}

	function getHook(tabTitle: string, index: number, contentItem: MetadataTabContentItem) {
		const key = createContentKey(tabTitle, index, contentItem);
		return contentHooksByKey[key] || null;
	}

	function getSelectedTab() {
		if (!useTabInfo?.content?.tabs?.length) {
			return null;
		}

		if (!activeTabId) {
			return useTabInfo.content.tabs[0] ?? null;
		}

		return useTabInfo.content.tabs.find((tab) => tab.title === activeTabId) || null;
	}

	$effect(() => {
		if (!isOpen) {
			hasLayerDef = null;
			layerDef = null;
		}
	});

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

	// TODO: move to useFetchLayerDef hook
	$effect(() => {
		const open = isOpen;
		if (!open) {
			return;
		}

		const localLayer = layer;
		if (!localLayer || localLayer.type === 'sublayer') {
			hasLayerDef = false;
			layerDef = null;
			return;
		}

		let cancelled = false;

		const parsedLayer = localLayer as __esri.FeatureLayer & {
			parsedUrl: { path: string };
		};

		const layerUrl: string | undefined = parsedLayer?.parsedUrl?.path;
		if (!layerUrl) {
			console.log('[ItemInfoDialog] No URL found for layer:', layer);
			hasLayerDef = false;
			return;
		}

		hasLayerDef = true;
		const load = async (url: string) => {
			try {
				const { data } = await esriRequest(url, {
					query: { f: 'json' },
					responseType: 'json'
				});
				if (cancelled) {
					hasLayerDef = false;
					return;
				}

				layerDef = data;
				layerDescription = layerDef?.description || null;
				layerCredits = layerDef?.copyrightText || null;
				console.log('[ItemInfoDialog] Loaded data:', data, 'for layer:', layer);
			} catch (error) {
				hasLayerDef = false;
				console.error('[ItemInfoDialog] Error loading portal item:', error);
			}
		};

		load(layerUrl);

		return () => {
			hasLayerDef = null;
			cancelled = true;
		};
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

	function downloadXml(value: string, filename = 'metadata.xml') {
		if (!value) return;
		const blob = new Blob([value], { type: 'application/xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
</script>

{#if layer && (hasLayerDef == false || (hasLayerDef == true && layerDef))}
	<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
		<Dialog.Content
			class="grid h-[80vh] min-h-0 min-w-[850px] grid-rows-[auto_1fr] overflow-hidden"
			onInteractOutside={(e) => {
				const overlay = document.querySelector('.svelte-lightbox-overlay');
				if (overlay && overlay.contains(e.target as Node)) e.preventDefault();
			}}
		>
			<Dialog.Header>
				<Dialog.Title>{layer.title ?? 'Name not found'}</Dialog.Title>
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
			{:else if useTabInfo && useTabInfo.content && useTabInfo.content.tabs.length > 0}
				<Tabs.Root
					class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
					value="information"
					onValueChange={(value) => (activeTabId = value)}
				>
					<Tabs.List class="shrink-0 self-center">
						<Tabs.Trigger value="information">Information</Tabs.Trigger>
						{#each useTabInfo.content.tabs as tab}
							<Tabs.Trigger value={tab.title}>{tab.title}</Tabs.Trigger>
						{/each}
					</Tabs.List>
					<Tabs.Content value="information" class="flex-1 min-h-0 overflow-hidden">
						<ScrollArea class="h-full w-full" type="always">
							<div>
								<div>
									<h4 class="text-lg font-semibold pb-2">Description</h4>
									<p>
										{layerDescription ?? 'No description available.'}
									</p>
								</div>

								<div>
									<h4 class="text-lg font-semibold pb-2">Credits</h4>
									<p>
										{layerCredits ?? 'No credits available.'}
									</p>
								</div>
							</div>
						</ScrollArea>
					</Tabs.Content>
					{#each useTabInfo.content.tabs as tab}
						<Tabs.Content value={tab.title} class="flex-1 min-h-0 overflow-hidden">
							<ScrollArea class="h-full w-full" type="always">
								<div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 py-1">
									{#each tab.content as contentItem, index}
										{@const contentHook = getHook(tab.title, index, contentItem)}
										{#if contentHook?.isLoading}
											<p class="w-full text-center text-sm italic text-muted-foreground">
												Loading content...
											</p>
										{:else if contentHook?.error}
											<p class="w-full text-center text-sm italic text-destructive">
												Error loading content: {formatHookError(contentHook.error)}
											</p>
										{:else if contentHook?.content}
											{#if contentItem.type === 'text'}
												<p
													class="w-full max-w-prose self-stretch whitespace-pre-wrap text-sm leading-relaxed"
												>
													{String(contentHook.content)}
												</p>
											{:else if contentItem.type === 'image'}
												<Lightbox imagePreset="scroll" enableImageExpand={true}>
													<img
														src={String(contentHook.content)}
														alt={`Metadata image ${index + 1}`}
														class="mx-auto max-h-[420px] w-auto cursor-zoom-in rounded-md object-contain"
													/>
												</Lightbox>
											{:else if contentItem.type === 'slideshow'}
												{#if Array.isArray(contentHook.content)}
													{@const images = contentHook.content}

													<LightboxGallery enableImageExpand={true}>
														<div slot="thumbnail" class="mx-auto w-full max-w-[520px]">
															<Carousel.Root>
																<Carousel.Content>
																	{#each images as imageUrl, imageIndex}
																		<Carousel.Item class="flex justify-center">
																			<GalleryThumbnail id={imageIndex}>
																				<img
																					src={imageUrl}
																					alt={`Slideshow image ${imageIndex + 1}`}
																					class="mx-auto max-h-[320px] w-auto cursor-zoom-in rounded-md object-contain"
																				/>
																			</GalleryThumbnail>
																		</Carousel.Item>
																	{/each}
																</Carousel.Content>

																<Carousel.Previous class="-start-8" />
																<Carousel.Next class="-end-8" />
															</Carousel.Root>
														</div>

														{#each images as imageUrl, imageIndex}
															<GalleryImage title={`Image ${imageIndex + 1}`}>
																<img src={imageUrl} alt={`Slideshow image ${imageIndex + 1}`} />
															</GalleryImage>
														{/each}
													</LightboxGallery>
												{/if}
											{:else if contentItem.type === 'xml'}
												{@const xmlString =
													typeof contentHook.content === 'string' ? contentHook.content : ''}
												<Card.Root class="w-full self-stretch py-2 gap-1">
													<Card.Header class="gap-0 pb-0 pt-0 mb-0 mt-0">
														<div class="flex w-full items-center justify-end gap-2">
															<CopyToClipboardButton value={xmlString} variant="outline" />

															<Button
																variant="outline"
																size="sm"
																disabled={!xmlString}
																onclick={() => downloadXml(xmlString)}
															>
																<ArrowDownToLine />
															</Button>
														</div>
													</Card.Header>
													<Card.Content class="pt-0 mt-0">
														<XmlTree xmlText={xmlString} expandAll={true} />
													</Card.Content>
												</Card.Root>
											{:else if contentItem.type === 'docx'}
												<a
													href={String(contentHook.content)}
													target="_blank"
													rel="noreferrer"
													class="text-sm underline"
												>
													Open document
												</a>
											{:else if contentItem.type === 'pdf'}
												<a
													href={String(contentHook.content)}
													target="_blank"
													rel="noreferrer"
													class="text-sm underline"
												>
													Open PDF
												</a>
											{/if}
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
{/if}

<!--
{#if layer && (hasLayerDef == false || (hasLayerDef == true && layerDef))}
	<Dialog.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
		<Dialog.Content
			class="flex max-h-[80vh] min-h-0 flex-col gap-4 overflow-hidden sm:max-w-[700px]"
		>
			<Dialog.Header>
				<Dialog.Title>{layer.title ?? 'Name not found'}</Dialog.Title>
				<Dialog.Description>Dataset Information</Dialog.Description>
			</Dialog.Header>
			<div class="flex-1 min-h-0 overflow-y-auto pr-4">
				<div class="flex flex-col gap-4">
					<p class="mx-auto max-w-prose text-center text-sm italic text-muted-foreground">
						WORK IN PROGRESS. The information that will be shown here includes metadata, source
						details (e.g. organisation and contact information), and other relevant information to
						help users understand the data.
					</p>

					{#if layerDescription}
						<div>
							<h4 class="text-lg font-semibold pb-2">Description</h4>
							<p class="whitespace-pre-wrap text-sm leading-relaxed">{layerDescription}</p>
						</div>
					{/if}

					{#if layerCopyright}
						<div>
							<h4 class="text-lg font-semibold pb-2">Copyright</h4>
							<p class="whitespace-pre-wrap text-sm leading-relaxed">{layerCopyright}</p>
						</div>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
-->

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
