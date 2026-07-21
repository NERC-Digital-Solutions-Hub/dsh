import 'fake-indexeddb/auto';

import { DownloadStatus, type DownloadEntry } from '$lib/Types/Download.types';
import { DexieDownloadRepository } from './DownloadRepository';
import { DexieSelectionRepository } from './SelectionRepository';
import { UprnDatabase } from './UprnDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let database: UprnDatabase;

beforeEach(() => {
	database = new UprnDatabase(`uprn-service-test-${crypto.randomUUID()}`);
});

afterEach(async () => {
	await database.delete();
});

describe('UPRN persistence repositories', () => {
	it('round-trips area and data selection snapshots', async () => {
		const repository = new DexieSelectionRepository(database);
		await repository.update('map-key', {
			areas: { nodeId: 'areas', areaIds: new Set([1, 2]) },
			data: [{ nodeId: 'dataset', selectedFieldIds: new Set(['a', 'b']) }]
		});

		const stored = await repository.get('map-key');
		expect(stored.portalItemId).toBe('map-key');
		expect([...stored.areas!.areaIds]).toEqual([1, 2]);
		expect([...stored.data[0].selectedFieldIds]).toEqual(['a', 'b']);
	});

	it('round-trips download records without changing their persisted shape', async () => {
		const repository = new DexieDownloadRepository(database);
		const entry: DownloadEntry = {
			localId: 'local-1',
			status: DownloadStatus.Pending,
			isDownloaded: false,
			areaSelection: { layerId: 'areas', areaFieldInfos: [{ id: 1, code: 'A1' }] },
			dataSelections: [{ layerId: 'dataset', fields: ['value'] }]
		};
		await repository.add(entry);
		await repository.update({ ...entry, externalId: 'job-1', status: DownloadStatus.Queued });

		const [stored] = await repository.getAll();
		expect(stored).toMatchObject({
			localId: 'local-1',
			externalId: 'job-1',
			status: DownloadStatus.Queued,
			areaSelection: entry.areaSelection,
			dataSelections: entry.dataSelections
		});
	});
});
