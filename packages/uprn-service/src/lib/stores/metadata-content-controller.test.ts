import type { MetadataTab } from '$lib/types/metadata.types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetadataContentController } from './metadata-content-controller.svelte';

afterEach(() => vi.restoreAllMocks());

describe('MetadataContentController', () => {
	it('caches resolved tab content and revokes object URLs on cleanup', async () => {
		const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-image');
		const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		const fetchImpl = vi
			.fn()
			.mockResolvedValue(
				new Response(new Blob(['image']), { status: 200, statusText: 'OK' })
			) as unknown as typeof fetch;
		const controller = new MetadataContentController(fetchImpl);
		const tab: MetadataTab = {
			title: 'Images',
			content: [{ type: 'image', source: '/image.png' }]
		};

		await controller.ensureTab(tab);
		await controller.ensureTab(tab);
		expect(fetchImpl).toHaveBeenCalledTimes(1);
		expect(createObjectUrl).toHaveBeenCalledTimes(1);
		expect(controller.getContentState('Images', 0, tab.content[0])?.content).toEqual({
			type: 'image',
			url: 'blob:test-image'
		});

		controller.destroy();
		expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-image');
	});

	it('ignores stale tab responses after a newer layer starts loading', async () => {
		let resolveFirst!: (response: Response) => void;
		const first = new Promise<Response>((resolve) => (resolveFirst = resolve));
		const fetchImpl = vi
			.fn()
			.mockReturnValueOnce(first)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ tabGroups: [{ title: 'New', tabs: [] }] }), {
					status: 200
				})
			) as unknown as typeof fetch;
		const controller = new MetadataContentController(fetchImpl);
		const staleLoad = controller.loadTabs('old', '/old');
		await controller.loadTabs('new', '/new');
		resolveFirst(new Response(JSON.stringify({ tabGroups: [{ title: 'Old', tabs: [] }] })));
		await staleLoad;
		expect(controller.tabGroups[0].title).toBe('New');
	});
});
