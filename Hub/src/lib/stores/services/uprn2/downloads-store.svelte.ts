import { SvelteMap } from 'svelte/reactivity';
import { db, addUserDownload, deleteUserDownload, getUserDownloads } from '$lib/db';
import { browser } from '$app/environment';
import { type DownloadEntry, DownloadStatus } from '$lib/types/uprn';

/**
 * Store for managing the current downloads.
 */
class DownloadsStore {
	#downloads: SvelteMap<string, DownloadEntry> = $state(new SvelteMap<string, DownloadEntry>());

	constructor() {
		if (!browser) {
			return;
		}
		// Load existing downloads from the database
		this.#loadDownloads();
	}

	addDownload(entry: DownloadEntry) {
		console.log('Adding download:', entry);
		this.#downloads.set(entry.id, entry);
		addUserDownload(entry.id);
	}

	removeDownload(id: string) {
		this.#downloads.delete(id);
		deleteUserDownload(id);
	}

	getDownloads(): DownloadEntry[] {
		return Array.from(this.#downloads.values());
	}

	async #loadDownloads() {
		const storedDownloads = await getUserDownloads();
		if (!storedDownloads || storedDownloads.length === 0) {
			return;
		}

		console.log('Loaded downloads from DB:', storedDownloads);
		storedDownloads.forEach((download) => {
			this.#downloads.set(download.downloadId, {
				id: download.downloadId,
				status: DownloadStatus.Pending
			});
		});
	}
}

export const downloadsStore = new DownloadsStore();
