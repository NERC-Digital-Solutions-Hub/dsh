export type DownloadEntry = {
	id: string;
	url: string;
	status: 'pending' | 'in-progress' | 'completed' | 'failed';
};

/**
 * Store for managing the current downloads.
 */
class DownloadsStore {
	public downloads: DownloadEntry[] = $state<DownloadEntry[]>([]);
}

export const downloadsStore = new DownloadsStore();
