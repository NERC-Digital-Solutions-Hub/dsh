import { SvelteMap } from 'svelte/reactivity';
import { db, addUserDownload, deleteUserDownload, getUserDownloads } from '$lib/db';
import { browser } from '$app/environment';

export type DownloadEntry = {
	id: string;
	status: 'pending' | 'in-progress' | 'completed' | 'failed';
};

/**
 * Store for managing the current downloads.
 */
class DownloadsStore {
	public downloads: DownloadEntry[] = $state<DownloadEntry[]>([]);

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
		console.log(
			'tables:',
			db.tables.map((t) => t.name)
		);
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
				status: 'pending'
			});
		});
	}
}

export const downloadsStore = new DownloadsStore();
