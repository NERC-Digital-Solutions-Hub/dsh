import type {
	MetadataResolvedContent,
	MetadataTab,
	MetadataTabContentItem,
	TabsPayload,
	TabGroup
} from '$lib/types/metadata.types';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export type MetadataContentState = {
	content: MetadataResolvedContent | null;
	error: unknown;
	isLoading: boolean;
};

export class MetadataContentController {
	public tabGroups = $state<TabGroup[]>([]);
	public isLoadingTabs = $state(false);
	public tabsError = $state<unknown>(null);
	public activeTabId = $state<string | null>(null);
	public readonly contentByKey = new SvelteMap<string, MetadataContentState>();

	private readonly objectUrls = new SvelteSet<string>();
	private loadGeneration = 0;

	constructor(private readonly fetchImpl: typeof fetch = fetch) {}

	public get flattenedTabs(): MetadataTab[] {
		return this.tabGroups.flatMap((group) => group.tabs);
	}

	public async loadTabs(layerId: string | null, url: string | null): Promise<void> {
		const generation = ++this.loadGeneration;
		this.clearContent();
		this.tabGroups = [];
		this.activeTabId = null;
		this.tabsError = null;
		if (!layerId || !url) return;

		this.isLoadingTabs = true;
		try {
			const response = await this.fetchImpl(url);
			if (!response.ok) throw new Error(`Failed to fetch metadata tabs: ${response.statusText}`);
			const payload = (await response.json()) as TabsPayload;
			if (generation !== this.loadGeneration) return;
			this.tabGroups = payload.tabGroups ?? [];
			this.activeTabId = this.flattenedTabs[0]?.title ?? null;
		} catch (error) {
			if (generation === this.loadGeneration) this.tabsError = error;
		} finally {
			if (generation === this.loadGeneration) this.isLoadingTabs = false;
		}
	}

	public async ensureTab(tab: MetadataTab | null): Promise<void> {
		if (!tab) return;
		await Promise.all(
			tab.content.map((contentItem, index) => this.ensureContent(tab.title, index, contentItem))
		);
	}

	public getContentState(
		tabTitle: string,
		index: number,
		contentItem: MetadataTabContentItem
	): MetadataContentState | null {
		return this.contentByKey.get(createContentKey(tabTitle, index, contentItem)) ?? null;
	}

	public destroy(): void {
		this.loadGeneration += 1;
		this.clearContent();
	}

	private async ensureContent(
		tabTitle: string,
		index: number,
		contentItem: MetadataTabContentItem
	): Promise<void> {
		const key = createContentKey(tabTitle, index, contentItem);
		if (this.contentByKey.has(key)) return;

		const state: MetadataContentState = $state({ content: null, error: null, isLoading: true });
		this.contentByKey.set(key, state);
		try {
			state.content = await this.resolveContent(contentItem);
		} catch (error) {
			state.error = error;
		} finally {
			state.isLoading = false;
		}
	}

	private async resolveContent(
		contentItem: MetadataTabContentItem
	): Promise<MetadataResolvedContent> {
		switch (contentItem.type) {
			case 'arcgisInfo':
				return { type: 'arcgisInfo' };
			case 'text':
			case 'disclaimer':
				return { type: contentItem.type, text: contentItem.value };
			case 'portalPage':
			case 'xml':
			case 'isoMetadata':
			case 'md':
				return {
					type: contentItem.type,
					text: await this.fetchText(contentItem.source)
				} as MetadataResolvedContent;
			case 'image':
				return { type: 'image', url: await this.fetchObjectUrl(contentItem.source, 'image') };
			case 'docx':
			case 'pdf':
				return {
					type: contentItem.type,
					name: contentItem.name ?? '',
					description: contentItem.description ?? '',
					url: await this.fetchObjectUrl(contentItem.source, contentItem.type)
				} as MetadataResolvedContent;
			case 'slideshow':
				return {
					type: 'slideshow',
					urls: await Promise.all(
						contentItem.source.map((source) => this.fetchObjectUrl(source, 'slideshow'))
					)
				};
		}
	}

	private async fetchText(url: string): Promise<string> {
		const response = await this.fetchImpl(url);
		if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.statusText}`);
		return response.text();
	}

	private async fetchObjectUrl(url: string, contentType: string): Promise<string> {
		const response = await this.fetchImpl(url);
		if (!response.ok) throw new Error(`Failed to fetch ${contentType}: ${response.statusText}`);
		const objectUrl = URL.createObjectURL(await response.blob());
		this.objectUrls.add(objectUrl);
		return objectUrl;
	}

	private clearContent(): void {
		for (const url of this.objectUrls) URL.revokeObjectURL(url);
		this.objectUrls.clear();
		this.contentByKey.clear();
	}
}

function createContentKey(
	tabTitle: string,
	index: number,
	contentItem: MetadataTabContentItem
): string {
	const source =
		'source' in contentItem
			? Array.isArray(contentItem.source)
				? contentItem.source.join('|')
				: contentItem.source
			: 'value' in contentItem
				? contentItem.value
				: '';
	return `${tabTitle}::${index}::${contentItem.type}::${source}`;
}
