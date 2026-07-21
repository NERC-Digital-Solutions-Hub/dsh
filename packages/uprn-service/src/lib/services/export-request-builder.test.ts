import { buildExportDownload } from '$lib/services/export-request-builder';
import type { INodeConfigProvider } from '$lib/services/i-node-config-provider';
import { DownloadStatus } from '$lib/types/download.types';
import { TreeviewNodeLayerType } from '$lib/types/treeview.types';
import { describe, expect, it } from 'vitest';

describe('buildExportDownload', () => {
	it('builds stable area and feature-layer payloads', () => {
		const provider = {
			getConfig: (id: string) =>
				id === 'dataset' ? { id, type: TreeviewNodeLayerType.FeatureLayer } : undefined
		} as INodeConfigProvider;
		const result = buildExportDownload(
			{
				areaLayerId: 'areas',
				areaIds: [10, 20],
				areaCodes: ['A10', 'A20'],
				dataSelections: [{ nodeId: 'dataset', selectedFieldIds: new Set(['x', 'y']) }]
			},
			provider,
			() => 'local-id'
		);

		expect(result).toEqual({
			localId: 'local-id',
			status: DownloadStatus.Pending,
			isDownloaded: false,
			areaSelection: {
				layerId: 'areas',
				areaFieldInfos: [
					{ id: 10, code: 'A10' },
					{ id: 20, code: 'A20' }
				]
			},
			dataSelections: [{ layerId: 'dataset', fields: ['x', 'y'] }]
		});
	});

	it('expands map-image selections into source-member requests', () => {
		const provider = {
			getConfig: () => ({ id: 'raster', type: TreeviewNodeLayerType.MapImageLayer })
		} as INodeConfigProvider;
		const result = buildExportDownload(
			{
				areaLayerId: 'areas',
				areaIds: [],
				areaCodes: [],
				dataSelections: [{ nodeId: 'raster', selectedFieldIds: new Set(['0', '1']) }]
			},
			provider,
			() => 'id'
		);
		expect(result.dataSelections).toEqual([
			{ layerId: 'raster-0', fields: [] },
			{ layerId: 'raster-1', fields: [] }
		]);
	});
});
