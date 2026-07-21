import type { INodeConfigProvider } from '$lib/Services/INodeConfigProvider';
import { TreeviewNodeLayerType } from '$lib/Types/Treeview.types';
import { DownloadStatus, type DownloadEntry } from '$lib/Types/Download.types';
import type { DataSelectionSnapshot } from '$lib/Types/Selection.types';

export type ExportSelectionInput = {
	areaLayerId: string;
	areaIds: number[];
	areaCodes: string[];
	dataSelections: DataSelectionSnapshot[];
};

export function buildExportDownload(
	input: ExportSelectionInput,
	nodeConfigProvider: INodeConfigProvider,
	createId: () => string = () => crypto.randomUUID()
): DownloadEntry {
	return {
		localId: createId(),
		status: DownloadStatus.Pending,
		isDownloaded: false,
		areaSelection: {
			layerId: input.areaLayerId,
			areaFieldInfos: input.areaIds.map((id, index) => ({ id, code: input.areaCodes[index] ?? '' }))
		},
		dataSelections: input.dataSelections.flatMap((selection) => {
			const config = nodeConfigProvider.getConfig(selection.nodeId);
			if (!config) return [];

			if (
				config.type === TreeviewNodeLayerType.MapImageLayer ||
				config.type === TreeviewNodeLayerType.TileLayer
			) {
				return [...selection.selectedFieldIds].map((fieldId) => ({
					layerId: `${selection.nodeId}-${fieldId}`,
					fields: []
				}));
			}

			return [{ layerId: selection.nodeId, fields: [...selection.selectedFieldIds] }];
		})
	};
}
