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

class AppDB extends Dexie {
	uprnSelections!: Table<DbUprnSelection, number>;

	constructor() {
		super('app-db');

		// Version 1 schema
		this.version(1).stores({
			uprnSelections: '++id'
		});
	}
}

export const db = new AppDB();

export const addSelection = (selection: DbUprnSelection) => db.uprnSelections.add(selection);

export const getSelections = () => db.uprnSelections.orderBy('createdAt').reverse().toArray();

export const updateSelection = (id: number, patch: Partial<DbUprnSelection>) =>
	db.uprnSelections.update(id, patch);

export const deleteSelection = (id: number) => db.uprnSelections.delete(id);

export const clearAll = () => db.uprnSelections.clear();
