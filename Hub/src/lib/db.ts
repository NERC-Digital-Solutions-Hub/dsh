import {
	DownloadStatus,
	type AreaSelectionInfo,
	type DataSelectionInfo,
	type DownloadEntry
} from '$lib/types/uprn';
import Dexie, { type Table } from 'dexie';

export interface DbUprnSelection {
	id?: number;
	areas: DbUprnAreaSelectionInfo;
	data: DbUprnDataSelectionInfo[];
	createdAt: number;
}

export interface DbUprnAreaSelectionInfo extends AreaSelectionInfo {
	id?: number;
}

export interface DbUprnDataSelectionInfo extends DataSelectionInfo {
	id?: number;
}

export interface DbUserDownload extends DownloadEntry {
	id?: number;
	createdAt: number;
}

class AppDB extends Dexie {
	uprnSelections!: Table<DbUprnSelection, number>;
	areaSelections!: Table<DbUprnAreaSelectionInfo, number>;
	dataSelections!: Table<DbUprnDataSelectionInfo, number>;
	userDownloads!: Table<DbUserDownload, number>;

	constructor() {
		super('app-db');

		// Version 1 schema
		this.version(1).stores({
			uprnSelections: '++id, createdAt',
			areaSelections: '++id, layerId, *areaIds',
			dataSelections: '++id, layerId, *fields',
			userDownloads: '++id, &localId, createdAt'
		});
	}
}

export const db = new AppDB();

export const addSelection = async (selection: DbUprnSelection) =>
	await db.uprnSelections.add(selection);

export const getSelections = async () =>
	await db.uprnSelections.orderBy('createdAt').reverse().toArray();

export const updateSelection = async (id: number, patch: Partial<DbUprnSelection>) =>
	await db.uprnSelections.update(id, patch);

export const deleteSelection = async (id: number) => await db.uprnSelections.delete(id);

export const clearAll = async () => await db.uprnSelections.clear();

export const addUserDownload = async (
	localId: string,
	areaSelection: AreaSelectionInfo,
	dataSelections: DataSelectionInfo[]
) =>
	await db.userDownloads.add({
		localId,
		areaSelection,
		dataSelections,
		status: DownloadStatus.Pending,
		createdAt: Date.now()
	});

export const updateUserDownload = async (
	localId: string,
	externalId?: string,
	areaSelection?: AreaSelectionInfo,
	dataSelections?: DataSelectionInfo[]
) => {
	// Build update object without undefined values
	const update: Record<string, any> = {};
	if (externalId !== undefined) update.externalId = externalId;
	if (areaSelection !== undefined) update.areaSelection = areaSelection;
	if (dataSelections !== undefined) update.dataSelections = dataSelections;

	if (Object.keys(update).length === 0) {
		return; // Nothing to update
	}

	await db.userDownloads.where('localId').equals(localId).modify(update);
};
export const getUserDownloads = async () =>
	await db.userDownloads.orderBy('createdAt').reverse().toArray();

export const deleteUserDownload = async (downloadId: string) =>
	await db.userDownloads.where('localId').equals(downloadId).delete();
