import type { IConfigurationTransformer } from '$lib/services/config-api/IConfigurationTransformer';
import type { DatasetRow, DatasetVariableRow } from '$lib/services/config-api/types';
import {
	TreeviewNodeType,
	TreeviewNodeTypology,
	TreeviewType,
	type TreeviewNodeConfig
} from '$lib/types/treeview';

type Input = {
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
};

type DatasetNode = DatasetRow & {
	parent: DatasetNode | null;
	children: DatasetNode[];
	variables: DatasetVariableRow[];
};

/**
 * Represents a configuration transformer that converts dataset variable rows into tree
 * view node configurations.
 */
export class ConfigTransformer implements IConfigurationTransformer<
	Input,
	ReadonlyArray<TreeviewNodeConfig>
> {
	/**
	 * Transforms the input datasets and variables into a treeview configuration.
	 * @param items The input containing datasets and variables.
	 * @returns A promise that resolves to an array of treeview node configurations.
	 */
	public async transform(items: Input): Promise<ReadonlyArray<TreeviewNodeConfig>> {
		const datasetMap: Map<string, DatasetNode> = this.mapRows(items.datasets, items.variables);
		const datasetByDatasetName: Map<string, DatasetNode> = new Map();
		for (const datasetNode of datasetMap.values()) {
			if (datasetNode.datasetName) {
				datasetByDatasetName.set(datasetNode.datasetName, datasetNode);
			}
		}

		const rootNodes: TreeviewNodeConfig[] = [];

		// Process each dataset node
		for (const datasetNode of datasetMap.values()) {
			if (datasetNode.parent !== null) {
				continue; // only root nodes should be processed here, children will be handled recursively in createDatasetConfig
			}

			const nodeConfig: TreeviewNodeConfig = this.createDatasetConfig(
				datasetNode,
				datasetByDatasetName
			);

			rootNodes.push(nodeConfig);
		}

		// Sort nodes by order
		this.sortNodes(rootNodes);

		return rootNodes;
	}

	/**
	 * Groups variables by dataset and creates DatasetNode objects.
	 */
	private mapRows(
		datasets: ReadonlyArray<DatasetRow>,
		variables: ReadonlyArray<DatasetVariableRow>
	): Map<string, DatasetNode> {
		const datasetById = new Map<string, DatasetNode>();
		const datasetByTitle = new Map<string, DatasetNode>();

		for (const dataset of datasets) {
			if (!dataset.wmId) {
				continue;
			}

			const datasetNode: DatasetNode = {
				...dataset,
				parent: null,
				children: [],
				variables: []
			};

			datasetById.set(dataset.wmId, datasetNode);
			datasetByTitle.set(dataset.wmTitle, datasetNode);
		}

		for (const datasetNode of datasetById.values()) {
			if (!datasetNode.wmId) {
				continue;
			}

			const path: string[] = datasetNode.tvPath
				.split('/')
				.map((path) => path.trim().replace(/\/+/g, ''))
				.filter((path) => path !== '');

			const lastPathSegment: string | null = path.length > 0 ? path[path.length - 1] : null;

			if (!lastPathSegment) {
				continue;
			}

			const parentDatasetNode: DatasetNode | undefined = datasetByTitle.get(lastPathSegment);
			if (!parentDatasetNode) {
				continue;
			}

			datasetNode.parent = parentDatasetNode;
			parentDatasetNode.children.push(datasetNode);
		}

		for (const variable of variables) {
			const id = variable.wmId;
			const datasetNode = datasetById.get(id);

			if (!datasetNode) {
				console.warn(`[ConfigTransformer] Orphan variable found with WmId: ${id}`);
				continue;
			}

			datasetNode.variables.push(variable);
		}

		return datasetById;
	}

	private createDatasetConfig(
		dataset: DatasetNode,
		datasetByDatasetName: Map<string, DatasetNode>
	): TreeviewNodeConfig {
		const type: TreeviewNodeType = this.getNodeType(dataset.wmLayerType);
		const typology: TreeviewNodeTypology = this.getNodeTypology(dataset.tvType);
		const treeviewType: TreeviewType = dataset.treeviewId
			? this.getNodeTreeviewType(dataset.treeviewId)
			: TreeviewType.Data;
		const visibilityDependencyIds: string[] | undefined =
			dataset.hasDependants && dataset.hasDependants.length > 0
				? dataset.hasDependants
						.map((id) => datasetByDatasetName.get(id)?.wmId)
						.filter((wmId): wmId is string => wmId !== undefined)
				: undefined;

		const datasetNodeConfigs = dataset.children.map((child) =>
			this.createDatasetConfig(child, datasetByDatasetName)
		);
		const variableNodeConfigs = dataset.variables.map((v) =>
			this.createVariableConfig(dataset, v, datasetByDatasetName)
		);

		return {
			id: dataset.wmId,
			name: dataset.wmTitle,
			displayName: dataset.alternativeTitle || undefined,
			type: type,
			typology: typology,
			treeviewType: treeviewType,
			isDownloadable: dataset.isEnabled,
			isOpenOnInit: dataset.isOpenOnInit,
			isVisibleOnInit: dataset.isVisibleOnInit,
			disableVisibilityToggle: dataset.disableVisibility,
			visibilityGroupId:
				dataset.visibilityGroupId !== null
					? this.getVisibilityGroupId(dataset.visibilityGroupId)
					: undefined,
			isHidden: !dataset.isListed,
			visibilityDependencyIds: visibilityDependencyIds,
			order: dataset.order,
			metadataTabInfoUrl: dataset.metadataTabInfoUrl || undefined,
			children: datasetNodeConfigs.concat(variableNodeConfigs)
		};
	}

	private createVariableConfig(
		dataset: DatasetNode,
		variable: DatasetVariableRow,
		datasetByDatasetName: Map<string, DatasetNode>
	): TreeviewNodeConfig {
		const id = this.getVariableConfigId(dataset.wmId, variable.variableName);

		const visibilityDependencyIds: string[] | undefined =
			variable.hasDependants && variable.hasDependants.length > 0
				? variable.hasDependants
						.map((id) => datasetByDatasetName.get(id)?.wmId)
						.filter((wmId): wmId is string => wmId !== undefined)
				: undefined;

		return {
			id: id,
			name: variable.variableName,
			displayName: variable.alternativeTitle || undefined,
			type: TreeviewNodeType.Field,
			typology: TreeviewNodeTypology.Variable,
			isDownloadable: variable.isEnabled,
			isOpenOnInit: variable.isOpenOnInit,
			isVisibleOnInit: variable.isVisibleOnInit,
			disableVisibilityToggle: variable.disableVisibility,
			visibilityGroupId:
				variable.visibilityGroupId !== null
					? this.getVisibilityGroupId(variable.visibilityGroupId)
					: undefined,
			isHidden: !variable.isListed,
			visibilityDependencyIds: visibilityDependencyIds,
			order: variable.order,
			metadataTabInfoUrl: variable.metadataTabInfoUrl || undefined,
			children: []
		};
	}

	private getNodeTypology(tvType: string): TreeviewNodeTypology {
		const lower = tvType.toLowerCase();
		switch (lower) {
			case 'vectordataset':
				return TreeviewNodeTypology.DatasetVector;
			case 'rasterdataset':
				return TreeviewNodeTypology.DatasetRaster;
			case 'folder':
				return TreeviewNodeTypology.Folder;
			case 'variable':
				return TreeviewNodeTypology.Variable;
			case 'area':
				return TreeviewNodeTypology.Area;
			default:
				return TreeviewNodeTypology.Variable; // Default
		}
	}

	private getNodeType(wmLayerType: string): TreeviewNodeType {
		const lower = wmLayerType.toLowerCase();
		switch (lower) {
			case 'arcgisfeaturelayer':
				return TreeviewNodeType.FeatureLayer;
			case 'arcgistiledmapservicelayer':
				return TreeviewNodeType.TileLayer;
			case 'arcgismapservicelayer':
				return TreeviewNodeType.MapImageLayer;
			case 'grouplayer':
				return TreeviewNodeType.GroupLayer;
			default:
				return TreeviewNodeType.None;
		}
	}

	private getNodeTreeviewType(treeviewId: string): TreeviewType {
		const lower = treeviewId.toLowerCase();
		switch (lower) {
			case 'area':
				return TreeviewType.Area;
			case 'data':
				return TreeviewType.Data;
			default:
				return TreeviewType.Data; // Default to 'Data' if not specified or unrecognized
		}
	}

	private getVisibilityGroupId(visibilityGroupId: number): string {
		switch (visibilityGroupId) {
			case 1:
				return 'group:area';
			case 2:
				return 'group:main';
			case 3:
				return 'group:uprn';
			default:
				throw new Error(`Unknown visibility group ID: ${visibilityGroupId}`);
		}
	}

	private getVariableConfigId(webMapId: string, variableName: string): string {
		return `${webMapId}-${variableName}`;
	}

	private sortNodes(nodes: TreeviewNodeConfig[]) {
		nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
		for (const node of nodes) {
			if (node.children && node.children.length > 0) {
				this.sortNodes(node.children);
			}
		}
	}
}
