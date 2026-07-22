import { DownloadStatus, type DownloadEntry } from '$lib/types/download.types';
import { uprnDatabase, type DbUserDownload, type UprnDatabase } from './uprn-database';

export interface DownloadRepository {
	add(entry: DownloadEntry): Promise<void>;
	update(entry: DownloadEntry): Promise<void>;
	remove(localId: string): Promise<void>;
	clear(): Promise<void>;
	getAll(): Promise<DbUserDownload[]>;
}

export class DexieDownloadRepository implements DownloadRepository {
	constructor(private readonly database: UprnDatabase = uprnDatabase) {}

	public async add(entry: DownloadEntry): Promise<void> {
		await this.database.userDownloads.add({
			localId: entry.localId,
			externalId: entry.externalId,
			areaSelection: entry.areaSelection,
			dataSelections: entry.dataSelections,
			status: entry.status ?? DownloadStatus.Pending,
			isDownloaded: entry.isDownloaded,
			errorMessage: entry.errorMessage,
			fileSize: entry.fileSize,
			createdAt: Date.now()
		});
	}

	public async update(entry: DownloadEntry): Promise<void> {
		await this.database.userDownloads.where('localId').equals(entry.localId).modify({
			externalId: entry.externalId,
			status: entry.status,
			errorMessage: entry.errorMessage,
			fileSize: entry.fileSize,
			areaSelection: entry.areaSelection,
			dataSelections: entry.dataSelections,
			isDownloaded: entry.isDownloaded
		});
	}

	public async remove(localId: string): Promise<void> {
		await this.database.userDownloads.where('localId').equals(localId).delete();
	}

	public async clear(): Promise<void> {
		await this.database.userDownloads.clear();
	}

	public async getAll(): Promise<DbUserDownload[]> {
		return this.database.userDownloads.orderBy('createdAt').reverse().toArray();
	}
}

export const downloadRepository = new DexieDownloadRepository();
