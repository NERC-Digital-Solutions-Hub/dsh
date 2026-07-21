import { uprnDatabase, type DbUprnSelection, type UprnDatabase } from './uprn-database';

export interface SelectionRepository {
	get(persistenceKey: string): Promise<DbUprnSelection>;
	update(persistenceKey: string, patch: Partial<DbUprnSelection>): Promise<void>;
	clear(persistenceKey: string): Promise<void>;
}

export class DexieSelectionRepository implements SelectionRepository {
	constructor(private readonly database: UprnDatabase = uprnDatabase) {}

	public async get(persistenceKey: string): Promise<DbUprnSelection> {
		let selection = await this.database.uprnSelections.get(persistenceKey);
		if (!selection) {
			selection = { portalItemId: persistenceKey, areas: null, data: [] };
			await this.database.uprnSelections.put(selection);
		}
		return selection;
	}

	public async update(persistenceKey: string, patch: Partial<DbUprnSelection>): Promise<void> {
		const updatedRows = await this.database.uprnSelections.update(persistenceKey, patch);
		if (updatedRows > 0) return;

		await this.database.uprnSelections.put({
			portalItemId: persistenceKey,
			areas: patch.areas ?? null,
			data: patch.data ?? []
		});
	}

	public async clear(persistenceKey: string): Promise<void> {
		await this.database.uprnSelections.put({
			portalItemId: persistenceKey,
			areas: null,
			data: []
		});
	}
}

export const selectionRepository = new DexieSelectionRepository();
