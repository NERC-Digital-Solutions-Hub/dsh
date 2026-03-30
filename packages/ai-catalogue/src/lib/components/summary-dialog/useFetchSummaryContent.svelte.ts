import type {
	SummaryContentItem,
	SummaryContentType,
	SummaryResolvedContent,
	SummaryResolvedContentByType
} from '$lib/types/summary.types';

type SummaryContentItemByType = {
	[K in SummaryContentType]: Extract<SummaryContentItem, { type: K }>;
};

type ContentFetcher<TType extends SummaryContentType> = (
	item: SummaryContentItemByType[TType]
) => Promise<SummaryResolvedContentByType[TType]>;

type ContentFetcherRegistry = {
	[K in SummaryContentType]: ContentFetcher<K>;
};

const fetchers: ContentFetcherRegistry = {
	md: async (item) => ({
		type: 'md',
		text: await fetchTextFromSource(item.source)
	}),
	html: async (item) => ({
		type: 'html',
		text: await fetchTextFromSource(item.source)
	}),
	xml: async (item) => ({
		type: 'xml',
		text: await fetchTextFromSource(item.source)
	}),
	text: async (item) => ({
		type: 'text',
		text: await fetchTextFromSource(item.source)
	})
};

function resolveContent<TType extends SummaryContentType>(item: SummaryContentItemByType[TType]) {
	return fetchers[item.type](item);
}

async function fetchTextFromSource(url: string) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch summary content: ${response.status} ${response.statusText}`);
	}

	return await response.text();
}

/**
 * Hook used to fetch a summary content item. It mirrors the item info dialog fetcher shape
 * so renderer support can scale without changing the dialog contract.
 */
export function useFetchSummaryContent(contentItem: SummaryContentItem) {
	let content = $state<SummaryResolvedContent | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			content = await resolveContent(contentItem);
		} catch (err) {
			error = err;
			content = null;
		} finally {
			isLoading = false;
		}
	}

	function clear() {
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
