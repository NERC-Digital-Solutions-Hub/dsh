import type { DownloadEntry } from '$lib/Types/Download.types';
import type { AreaSelectionSnapshot, DataSelectionSnapshot } from '$lib/Types/Selection.types';
import type { TreeviewNodeConfig } from '$lib/Types/Treeview.types';
import Dexie, { type Table } from 'dexie';

export interface DbUprnSelection {
	portalItemId: string;
	areas: DbUprnAreaSelectionInfo | null;
	data: DbUprnDataSelectionInfo[];
}

export interface DbUprnAreaSelectionInfo extends AreaSelectionSnapshot {
	id?: number;
}

export interface DbUprnDataSelectionInfo extends DataSelectionSnapshot {
	id?: number;
}

export interface DbUserDownload extends Omit<DownloadEntry, 'displayInfo'> {
	id?: number;
	createdAt: number;
}

export interface DbCachedTransformedConfig {
	url: string;
	version: number;
	layers: TreeviewNodeConfig[];
	cachedAt: number;
}

/**
 * Dexie schema for the UPRN application.
 *
 * Legacy stores remain declared so existing browser databases continue to open without a
 * destructive migration. Active persistence uses `uprnSelections` and `userDownloads`.
 */
export class UprnDatabase extends Dexie {
	public uprnSelections!: Table<DbUprnSelection, string>;
	public areaSelections!: Table<DbUprnAreaSelectionInfo, number>;
	public dataSelections!: Table<DbUprnDataSelectionInfo, number>;
	public userDownloads!: Table<DbUserDownload, number>;
	public cachedConfigs!: Table<DbCachedTransformedConfig, string>;

	constructor(databaseName = 'uprn-service-db') {
		super(databaseName);

		this.version(1).stores({
			uprnSelections: '&portalItemId',
			areaSelections: '++id, layerId, *areaIds',
			dataSelections: '++id, layerId, *fields',
			userDownloads: '++id, &localId, createdAt'
		});
		this.version(2).stores({
			uprnSelections: '&portalItemId',
			areaSelections: '++id, layerId, *areaIds',
			dataSelections: '++id, layerId, *fields',
			userDownloads: '++id, &localId, createdAt',
			cachedConfigs: '&url, version'
		});
		this.version(3)
			.stores({
				uprnSelections: '&portalItemId',
				areaSelections: '++id, layerId, *areaIds',
				dataSelections: '++id, layerId, *fields',
				userDownloads: '++id, &localId, createdAt',
				cachedConfigs: '&url, version'
			})
			.upgrade(async (transaction) => {
				await transaction.table('cachedConfigs').clear();
			});
	}
}

export const uprnDatabase = new UprnDatabase();

export async function clearUprnDatabase(database: UprnDatabase = uprnDatabase): Promise<void> {
	await database.uprnSelections.clear();
	await database.userDownloads.clear();
	await database.cachedConfigs.clear();
}
