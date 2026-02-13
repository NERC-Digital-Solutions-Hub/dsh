import type { MetadataTabContentItem } from '$lib/types/metadata';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Hook used to fetch a metadata content item. It manages loading state, any fetch errors,
 * and the resolved content payload.
 *
 * - text: resolves to string content
 * - image/docx/pdf: resolves to an object URL string
 * - slideshow: resolves to an array of object URL strings
 */
export function useFetchMetadataContent(contentItem: MetadataTabContentItem) {
	let content = $state<string | string[] | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	const objectUrls = new SvelteSet<string>();

	function revokeObjectUrls() {
		for (const url of objectUrls) {
			URL.revokeObjectURL(url);
		}
		objectUrls.clear();
	}

	async function fetchText(url: string) {
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

			switch (contentItem.type) {
				case 'text':
					content = await fetchText(contentItem.link);
					break;
				case 'image':
					content = await fetchBlobAsObjectUrl(contentItem.link, 'image');
					break;
				case 'docx':
					content = await fetchBlobAsObjectUrl(contentItem.link, 'docx');
					break;
				case 'pdf':
					content = await fetchBlobAsObjectUrl(contentItem.link, 'pdf');
					break;
				case 'slideshow': {
					const urls = await Promise.all(
						contentItem.links.map((link) => fetchBlobAsObjectUrl(link, 'slideshow'))
					);
					content = urls;
					break;
				}
			}
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
