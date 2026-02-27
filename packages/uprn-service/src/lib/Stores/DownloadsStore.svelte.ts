import { browser } from '$app/environment';
import {
	addUserDownload,
	clearUserDownloads,
	deleteUserDownload,
	getUserDownloads,
	updateUserDownload
} from '$lib/db';
import { type DownloadEntry } from '$lib/Types/Uprn.types';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store for managing the current downloads.
 */
export default class DownloadsStore {
	#downloads: SvelteMap<string, DownloadEntry> = $state(new SvelteMap<string, DownloadEntry>());

	constructor() {
		if (!browser) {
			return;
		}
		this.#loadDownloads();
	}

	public addDownload(entry: DownloadEntry) {
		console.log('[downloads-store] Adding download:', entry);
		this.#downloads.set(entry.localId, entry);
		addUserDownload(entry.localId, entry.areaSelection, entry.dataSelections);
	}

	public updateDownloadStatus(entry: DownloadEntry) {
		console.log('[downloads-store] Updating download status:', entry);
		this.#downloads.set(entry.localId, { ...entry });
		updateUserDownload(
			entry.localId,
			entry.externalId,
			entry.status,
			entry.errorMessage,
			entry.areaSelection,
			entry.dataSelections
		);
	}

	public removeDownload(localId: string) {
		this.#downloads.delete(localId);
		deleteUserDownload(localId);
	}

	public async clearDownloads() {
		this.#downloads.clear();
		await clearUserDownloads();
		console.log('[downloads-store] All downloads cleared');
	}

	public getDownloads(): DownloadEntry[] {
		return Array.from(this.#downloads.values());
	}

	async #loadDownloads() {
		const storedDownloads = await getUserDownloads();
		if (!storedDownloads || storedDownloads.length === 0) {
			return;
		}

		console.log('[downloads-store] Loaded downloads from DB:', storedDownloads);
		storedDownloads.forEach((download) => {
			this.#downloads.set(download.localId, {
				localId: download.localId,
				externalId: download.externalId,
				status: download.status,
				errorMessage: download.errorMessage,
				areaSelection: download.areaSelection,
				dataSelections: download.dataSelections
			});
		});
	}
}
