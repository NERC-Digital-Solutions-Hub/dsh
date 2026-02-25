import type { AreaSelectionStoreSnapshot } from '$lib/Stores/AreaSelectionStore.svelte';
import type { DataSelectionSnapshot } from '$lib/Stores/DataSelectionStore.svelte';
import type { TreeviewNodeConfig } from '$lib/Types/treeview';
import {
	DownloadStatus,
	type AreaSelectionInfoWithCode,
	type DataSelectionInfo,
	type DownloadEntry
} from '$lib/Types/uprn';
import Dexie, { type Table } from 'dexie';

export interface DbUprnSelection {
	portalItemId: string;
	areas: DbUprnAreaSelectionInfo | null;
	data: DbUprnDataSelectionInfo[];
}

export interface DbUprnAreaSelectionInfo extends AreaSelectionStoreSnapshot {
	id?: number;
}

export interface DbUprnDataSelectionInfo extends DataSelectionSnapshot {
	id?: number;
}

export interface DbUserDownload extends DownloadEntry {
	id?: number;
	createdAt: number;
}

/**
 * A cached transformed-config record keyed by the manifest URL.
 *
 * Stores the fully transformed `TreeviewNodeConfig[]` alongside the manifest
 * version so subsequent loads can skip the CSV fetch + transform pipeline when
 * the remote manifest version has not changed.
 */
export interface DbCachedTransformedConfig {
	/** The manifest endpoint URL – used as the primary key. */
	url: string;
	/** The manifest version that produced this transformed config. */
	version: number;
	/** The transformed treeview node configs derived from the CSV data. */
	layers: TreeviewNodeConfig[];
	/** Epoch millis when this entry was written. */
	cachedAt: number;
}

class AppDB extends Dexie {
	public uprnSelections!: Table<DbUprnSelection, string>;
	public areaSelections!: Table<DbUprnAreaSelectionInfo, number>;
	public dataSelections!: Table<DbUprnDataSelectionInfo, number>;
	public userDownloads!: Table<DbUserDownload, number>;
	public cachedConfigs!: Table<DbCachedTransformedConfig, string>;

	constructor() {
		super('uprn-service-db');
		this.version(1).stores({
			uprnSelections: '&portalItemId',
			areaSelections: '++id, layerId, *areaIds',
			dataSelections: '++id, layerId, *fields',
			userDownloads: '++id, &localId, createdAt'
		});
		this.version(2).stores({
			cachedConfigs: '&url, version'
		});
	}
}

export const db = new AppDB();

export const getSelection = async (portalItemId: string): Promise<DbUprnSelection> => {
	let selection = await db.uprnSelections.get(portalItemId);

	if (!selection) {
		selection = {
			portalItemId: portalItemId,
			areas: null,
			data: []
		};
		await db.uprnSelections.add(selection);
	}

	return selection;
};

export const updateSelection = async (portalItemId: string, patch: Partial<DbUprnSelection>) => {
	let current = await db.uprnSelections.get(portalItemId);

	if (!current) {
		current = { portalItemId: portalItemId, areas: null, data: [] };
		await db.uprnSelections.add(current);
	}

	await db.uprnSelections.update(portalItemId, patch);
};

export const clearSelections = async (portalItemId: string) => {
	await db.uprnSelections.put({
		portalItemId: portalItemId,
		areas: null,
		data: []
	});
};

export const addUserDownload = async (
	localId: string,
	areaSelection: AreaSelectionInfoWithCode,
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
	status?: DownloadStatus,
	errorMessage?: string,
	areaSelection?: AreaSelectionInfoWithCode,
	dataSelections?: DataSelectionInfo[]
) => {
	const update: Record<string, any> = {};
	if (externalId !== undefined) update.externalId = externalId;
	if (status !== undefined) update.status = status;
	if (errorMessage !== undefined) update.errorMessage = errorMessage;
	if (areaSelection !== undefined) update.areaSelection = areaSelection;
	if (dataSelections !== undefined) update.dataSelections = dataSelections;

	if (Object.keys(update).length === 0) {
		return;
	}

	console.log('[db] Updating user download:', localId, update);

	await db.userDownloads.where('localId').equals(localId).modify(update);
};
export const getUserDownloads = async () =>
	await db.userDownloads.orderBy('createdAt').reverse().toArray();

export const deleteUserDownload = async (downloadId: string) =>
	await db.userDownloads.where('localId').equals(downloadId).delete();

export const clearUserDownloads = async () => await db.userDownloads.clear();

export const clearDatabase = async () => {
	await db.uprnSelections.clear();
	await db.userDownloads.clear();
	await db.cachedConfigs.clear();
};

// ---------------------------------------------------------------------------
// Transformed-config cache helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves a cached transformed config for the given manifest URL, if one exists.
 */
export const getCachedConfig = async (
	url: string
): Promise<DbCachedTransformedConfig | undefined> => await db.cachedConfigs.get(url);

/**
 * Inserts or replaces the cached transformed config for a given manifest URL.
 */
export const putCachedConfig = async (
	url: string,
	version: number,
	layers: TreeviewNodeConfig[]
): Promise<void> => {
	await db.cachedConfigs.put({
		url,
		version,
		layers,
		cachedAt: Date.now()
	});
};

/**
 * Removes a single cached transformed-config entry.
 */
export const deleteCachedConfig = async (url: string): Promise<void> => {
	await db.cachedConfigs.delete(url);
};

/**
 * Clears all cached transformed configs.
 */
export const clearCachedConfigs = async (): Promise<void> => {
	await db.cachedConfigs.clear();
};
