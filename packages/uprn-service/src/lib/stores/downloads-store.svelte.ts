import { browser } from '$app/environment';
import { downloadRepository, type DownloadRepository } from '$lib/persistence/download-repository';
import type { DownloadEntry } from '$lib/types/download.types';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store for managing the current downloads.
 */
export class DownloadsStore {
	#downloads: SvelteMap<string, DownloadEntry> = $state(new SvelteMap<string, DownloadEntry>());
	readonly #repository: DownloadRepository;

	constructor(repository: DownloadRepository = downloadRepository) {
		this.#repository = repository;
		if (!browser) {
			return;
		}
		void this.#loadDownloads();
	}

	public addDownload(entry: DownloadEntry) {
		this.#downloads.set(entry.localId, entry);
		void this.#repository.add(entry);
	}

	public updateDownloadStatus(entry: DownloadEntry) {
		this.#downloads.set(entry.localId, { ...entry });
		void this.#repository.update(entry);
	}

	public removeDownload(localId: string) {
		this.#downloads.delete(localId);
		void this.#repository.remove(localId);
	}

	public async clearDownloads() {
		this.#downloads.clear();
		await this.#repository.clear();
	}

	public getDownloads(): DownloadEntry[] {
		return Array.from(this.#downloads.values());
	}

	async #loadDownloads() {
		const storedDownloads = await this.#repository.getAll();
		if (!storedDownloads || storedDownloads.length === 0) {
			return;
		}

		storedDownloads.forEach((download) => {
			this.#downloads.set(download.localId, {
				localId: download.localId,
				externalId: download.externalId,
				status: download.status,
				isDownloaded: download.isDownloaded ?? false,
				errorMessage: download.errorMessage,
				fileSize: download.fileSize,
				areaSelection: download.areaSelection,
				dataSelections: download.dataSelections
			});
		});
	}
}

export default DownloadsStore;
