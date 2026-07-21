import type { DownloadRepository } from '$lib/Persistence/DownloadRepository';
import type { UprnDownloadClient } from '$lib/Services/UprnDownloadClient';
import DownloadsStore from '$lib/Stores/DownloadsStore.svelte';
import {
	DownloadStatus,
	JobRequestResponseType,
	JobStatusType,
	type DownloadEntry
} from '$lib/Types/Download.types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DownloadsController } from './DownloadsController.svelte';

const repository: DownloadRepository = {
	add: async () => {},
	update: async () => {},
	remove: async () => {},
	clear: async () => {},
	getAll: async () => []
};

afterEach(() => vi.useRealTimers());

describe('DownloadsController', () => {
	it('submits pending jobs and applies queue/completion transitions', async () => {
		const store = new DownloadsStore(repository);
		const entry: DownloadEntry = {
			localId: 'local',
			status: DownloadStatus.Pending,
			isDownloaded: false,
			areaSelection: { layerId: 'areas', areaFieldInfos: [{ id: 1, code: 'A1' }] },
			dataSelections: [{ layerId: 'data', fields: ['field'] }]
		};
		store.addDownload(entry);
		const getJobStatuses = vi
			.fn()
			.mockResolvedValueOnce({
				queue: { current: 1, total: 1 },
				jobs: [
					{
						guid: 'job',
						status: {
							type: JobStatusType.Queued,
							fileSize: undefined,
							message: undefined,
							queueId: 4,
							queuePosition: 2
						}
					}
				]
			})
			.mockResolvedValueOnce({
				queue: { current: 1, total: 1 },
				jobs: [
					{
						guid: 'job',
						status: {
							type: JobStatusType.Completed,
							fileSize: 123,
							message: undefined,
							queueId: 4,
							queuePosition: 0
						}
					}
				]
			});
		const client = {
			requestJob: vi.fn().mockResolvedValue({
				type: JobRequestResponseType.Success,
				guid: 'job',
				queueId: 4,
				queuePosition: 2
			}),
			getJobStatuses
		} as unknown as UprnDownloadClient;
		const controller = new DownloadsController(store, client, 'portal');

		await controller.submitRequests();
		expect(store.getDownloads()[0]).toMatchObject({
			status: DownloadStatus.Submitted,
			externalId: 'job'
		});
		await controller.checkJobStatuses();
		expect(store.getDownloads()[0].status).toBe(DownloadStatus.Queued);
		expect(controller.queuePositions.get('job')).toEqual({ queueId: 4, queuePosition: 2 });
		await controller.checkJobStatuses();
		expect(store.getDownloads()[0]).toMatchObject({
			status: DownloadStatus.Completed,
			fileSize: 123
		});
		controller.stop();
	});

	it('uses the burst interval for polling newly submitted jobs', async () => {
		vi.useFakeTimers();
		const store = new DownloadsStore(repository);
		store.addDownload({
			localId: 'local',
			status: DownloadStatus.Pending,
			isDownloaded: false,
			areaSelection: { layerId: 'areas', areaFieldInfos: [] },
			dataSelections: []
		});
		const client = {
			requestJob: vi.fn().mockResolvedValue({
				type: JobRequestResponseType.Success,
				guid: 'job',
				queueId: 1,
				queuePosition: 1
			}),
			getJobStatuses: vi.fn().mockResolvedValue({ queue: { current: 0, total: 0 }, jobs: [] })
		} as unknown as UprnDownloadClient;
		const controller = new DownloadsController(store, client, 'portal', {
			burstIntervalMs: 10,
			burstDurationMs: 100,
			intervalMs: 1000
		});
		controller.start();
		await vi.advanceTimersByTimeAsync(10);
		expect(client.getJobStatuses).toHaveBeenCalled();
		controller.stop();
	});
});
