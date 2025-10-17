import Dexie, { type Table } from 'dexie';

export interface DbUprnSelection {
	id?: number;
	areas: DbUprnAreaSelection;
	data: DbUprnDataSelection[];
	createdAt: number;
}

export interface DbUprnDataSelection {
	id?: number;
	layerId: string;
	fields: string[];
}

export interface DbUprnAreaSelection {
	id?: number;
	layerId: string;
	areaIds: string[];
}

export interface DbUserDownload {
	id?: number;
	downloadId: string;
	createdAt: number;
}

class AppDB extends Dexie {
	uprnSelections!: Table<DbUprnSelection, number>;
	areaSelections!: Table<DbUprnAreaSelection, number>;
	dataSelections!: Table<DbUprnDataSelection, number>;
	userDownloads!: Table<DbUserDownload, number>;

	constructor() {
		super('app-db');

		// Version 1 schema
		this.version(1).stores({
			uprnSelections: '++id, createdAt',
			areaSelections: '++id, layerId, *areaIds',
			dataSelections: '++id, layerId, *fields',
			userDownloads: '++id, &downloadId, createdAt'
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

export const addUserDownload = async (downloadId: string) =>
	await db.userDownloads.add({ downloadId, createdAt: Date.now() });

export const getUserDownloads = async () =>
	await db.userDownloads.orderBy('createdAt').reverse().toArray();

export const deleteUserDownload = async (downloadId: string) =>
	await db.userDownloads.where('downloadId').equals(downloadId).delete();
