import type { MetadataTabContentItem } from '$lib/Types/Metadata.types';
import { SvelteSet } from 'svelte/reactivity';

type ContentType = MetadataTabContentItem['type'];

type MetadataContentItemByType = {
	[K in ContentType]: Extract<MetadataTabContentItem, { type: K }>;
};

type MetadataResolvedContentByType = {
	arcgisInfo: { type: 'arcgisInfo' };
	text: { type: 'text'; text: string };
	disclaimer: { type: 'disclaimer'; text: string };
	image: { type: 'image'; url: string };
	xml: { type: 'xml'; text: string };
	xmlKeyInfo: { type: 'xmlKeyInfo'; text: string };
	md: { type: 'md'; text: string };
	docx: { type: 'docx'; name: string; url: string };
	pdf: { type: 'pdf'; name: string; url: string };
	slideshow: { type: 'slideshow'; urls: string[] };
};

export type MetadataResolvedContent = MetadataResolvedContentByType[ContentType];

type FetcherUtils = {
	fetchTextFromSource: (url: string) => Promise<string>;
	fetchBlobAsObjectUrl: (url: string, contentType: string) => Promise<string>;
};

type ContentFetcher<TType extends ContentType> = (
	item: MetadataContentItemByType[TType],
	utils: FetcherUtils
) => Promise<MetadataResolvedContentByType[TType]>;

type ContentFetcherRegistry = {
	[K in ContentType]: ContentFetcher<K>;
};

const fetchers: ContentFetcherRegistry = {
	arcgisInfo: async () => ({ type: 'arcgisInfo' }),
	text: async (item) => ({
		type: 'text',
		text: item.value
	}),
	disclaimer: async (item) => ({
		type: 'disclaimer',
		text: item.value
	}),
	image: async (item, utils) => ({
		type: 'image',
		url: await utils.fetchBlobAsObjectUrl(item.source, 'image')
	}),
	xml: async (item, utils) => ({
		type: 'xml',
		text: await utils.fetchTextFromSource(item.source)
	}),
	xmlKeyInfo: async (item, utils) => ({
		type: 'xmlKeyInfo',
		text: await utils.fetchTextFromSource(item.source)
	}),
	md: async (item, utils) => ({
		type: 'md',
		text: await utils.fetchTextFromSource(item.source)
	}),
	docx: async (item, utils) => ({
		type: 'docx',
		name: item.name ?? '',
		url: await utils.fetchBlobAsObjectUrl(item.source, 'docx')
	}),
	pdf: async (item, utils) => ({
		type: 'pdf',
		name: item.name ?? '',
		url: await utils.fetchBlobAsObjectUrl(item.source, 'pdf')
	}),
	slideshow: async (item, utils) => ({
		type: 'slideshow',
		urls: await Promise.all(
			item.source.map((link) => utils.fetchBlobAsObjectUrl(link, 'slideshow'))
		)
	})
};

function resolveContent<TType extends ContentType>(
	item: MetadataContentItemByType[TType],
	utils: FetcherUtils
) {
	return fetchers[item.type](item, utils);
}

/**
 * Hook used to fetch a metadata content item. It manages loading state, any fetch errors,
 * and a discriminated-union resolved content payload.
 */
export function useFetchMetadataContent(contentItem: MetadataTabContentItem) {
	let content = $state<MetadataResolvedContent | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	const objectUrls = new SvelteSet<string>();

	function revokeObjectUrls() {
		for (const url of objectUrls) {
			URL.revokeObjectURL(url);
		}
		objectUrls.clear();
	}

	async function fetchTextFromSource(url: string) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch text content: ${response.status} ${response.statusText}`);
		}

		return await response.text();
	}

	async function fetchBlobAsObjectUrl(url: string, contentType: string) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch ${contentType} content: ${response.status} ${response.statusText}`
			);
		}

		const objectUrl = URL.createObjectURL(await response.blob());
		objectUrls.add(objectUrl);
		return objectUrl;
	}

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			revokeObjectUrls();

			content = await resolveContent(contentItem, {
				fetchTextFromSource,
				fetchBlobAsObjectUrl
			});
		} catch (err) {
			error = err;
			content = null;
		} finally {
			isLoading = false;
		}
	}

	function clear() {
		revokeObjectUrls();
		content = null;
		error = null;
	}

	return {
		get content() {
			return content;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		fetch: fetchAsync,
		clear
	};
}
