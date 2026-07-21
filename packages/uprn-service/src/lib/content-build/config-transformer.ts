import {
	TreeviewNodeLayerType,
	TreeviewNodeTypology,
	TreeviewType,
	type TreeviewNodeConfig
} from '$lib/types/treeview.types';
import type { DatasetRow, DatasetVariableRow, FolderRow } from './types';

export type UprnTreeviewTransformInput = {
	folders: ReadonlyArray<FolderRow>;
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
};

export class ConfigTransformer {
	public transform(items: UprnTreeviewTransformInput): ReadonlyArray<TreeviewNodeConfig> {
		const nodesById = new Map<string, TreeviewNodeConfig>();
		const nodeByKey = new Map<string, TreeviewNodeConfig>();
		const roots: TreeviewNodeConfig[] = [];

		const folderRowByFullPath = new Map<string, FolderRow>();
		for (const folder of items.folders) {
			if (!folder.folderName) continue;
			folderRowByFullPath.set(joinPath(normalizePath(folder.tvPath), folder.folderName), folder);
		}

		const datasetRowByFullPath = new Map<string, DatasetRow>();
		const datasetRowByDatasetName = new Map<string, DatasetRow>();
		const datasetIdentifiers = new Set<string>();
		for (const dataset of items.datasets) {
			if (!dataset.tvTitle.trim()) {
				console.warn(
					`[ConfigTransformer] Dataset "${dataset.wmId}" has empty TvTitle; skipping to avoid path cycles.`
				);
				continue;
			}

			const datasetFullPath = joinPath(normalizePath(dataset.tvPath), dataset.tvTitle);
			datasetRowByFullPath.set(datasetFullPath, dataset);

			const datasetName = normalizeKey(dataset.datasetName);
			if (datasetName) datasetRowByDatasetName.set(datasetName, dataset);
			const titleKey = normalizeKey(dataset.tvTitle);
			if (titleKey) datasetIdentifiers.add(titleKey);
			if (datasetName) datasetIdentifiers.add(datasetName);
		}

		const ensureFolderNode = (fullPath: string, row?: FolderRow): TreeviewNodeConfig => {
			const key = `folder::${fullPath}`;
			const existing = nodeByKey.get(key);
			if (existing) return existing;

			const folderName = lastSegment(fullPath);
			const node: TreeviewNodeConfig = {
				id: `folder:${fullPath}`,
				name: folderName || undefined,
				displayName: row?.tvTitle || folderName || undefined,
				type: TreeviewNodeLayerType.GroupLayer,
				typology: TreeviewNodeTypology.Folder,
				treeviewType: row?.treeviewId ? getNodeTreeviewType(row.treeviewId) : TreeviewType.Data,
				isEnabled: row?.isEnabled ?? false,
				isOpenOnInit: row?.isOpenOnInit ?? false,
				isHidden: row ? !row.isListed : false,
				order: row?.order ?? 0,
				metadataTabInfoUrl: row?.metadataConfigUrl || undefined,
				children: []
			};

			nodeByKey.set(key, node);
			nodesById.set(node.id, node);
			return node;
		};

		const datasetNameToNodeId = new Map<string, string>();
		const ensureDatasetNode = (fullPath: string, row: DatasetRow): TreeviewNodeConfig => {
			const key = `dataset::${fullPath}`;
			const existing = nodeByKey.get(key);
			if (existing) return existing;

			const node: TreeviewNodeConfig = {
				id: row.wmId,
				name: row.tvTitle,
				displayName: row.tvTitle || undefined,
				type: getNodeType(row.wmLayerType),
				typology: getNodeTypology(row.tvType),
				treeviewType: row.treeviewId ? getNodeTreeviewType(row.treeviewId) : TreeviewType.Data,
				isEnabled: row.isEnabled,
				disabledReason: row.disabledReason || undefined,
				isOpenOnInit: row.isOpenOnInit,
				isVisibleOnInit: row.isRenderedOnInit,
				disableVisibilityToggle: row.disableRendering,
				visibilityDependencyIds: row.hasDependants ?? undefined,
				visibilityGroupId:
					row.visibilityGroupId !== null ? getVisibilityGroupId(row.visibilityGroupId) : undefined,
				isHidden: !row.isListed,
				order: row.order,
				metadataTabInfoUrl: row.metadataConfigUrl || undefined,
				layerId: row.wmId || undefined,
				children: []
			};

			nodeByKey.set(key, node);
			nodesById.set(node.id, node);
			const datasetName = normalizeKey(row.datasetName);
			if (datasetName) datasetNameToNodeId.set(datasetName, node.id);
			return node;
		};

		const resolveDeepestParentNode = (parentPath: string): TreeviewNodeConfig | null => {
			let current = '/';
			let found: TreeviewNodeConfig | null = null;

			for (const segment of getPathSegments(parentPath)) {
				current = joinPath(current, segment);
				found =
					nodeByKey.get(`folder::${current}`) ?? nodeByKey.get(`dataset::${current}`) ?? found;
			}

			return found;
		};

		for (const [fullPath, row] of folderRowByFullPath) ensureFolderNode(fullPath, row);
		for (const [fullPath, row] of datasetRowByFullPath) ensureDatasetNode(fullPath, row);

		for (const [fullPath, row] of folderRowByFullPath) {
			attachChildSafe(
				resolveDeepestParentNode(normalizePath(row.tvPath)),
				ensureFolderNode(fullPath, row),
				roots
			);
		}

		for (const [fullPath, row] of datasetRowByFullPath) {
			attachChildSafe(
				resolveDeepestParentNode(normalizePath(row.tvPath)),
				ensureDatasetNode(fullPath, row),
				roots
			);
		}

		const datasetFullPathByDatasetName = new Map<string, string>();
		for (const [fullPath, row] of datasetRowByFullPath) {
			const datasetName = normalizeKey(row.datasetName);
			if (datasetName) datasetFullPathByDatasetName.set(datasetName, fullPath);
		}

		for (const variable of items.variables) {
			const datasetName = normalizeKey(variable.datasetName);
			if (!datasetName) {
				console.warn(
					`[ConfigTransformer] Variable "${variable.tvVariableName}" is missing DatasetName and cannot be joined to a dataset.`
				);
				continue;
			}

			const datasetFullPath = datasetFullPathByDatasetName.get(datasetName);
			const datasetRow = datasetRowByDatasetName.get(datasetName);
			if (!datasetFullPath || !datasetRow) {
				console.warn(
					`[ConfigTransformer] Orphan variable found with DatasetName: ${variable.datasetName}`
				);
				continue;
			}

			const datasetNode =
				nodeByKey.get(`dataset::${datasetFullPath}`) ??
				ensureDatasetNode(datasetFullPath, datasetRow);
			let parent = datasetNode;
			let currentPathUnderDataset = datasetFullPath;

			for (const segment of getPathSegments(variable.tvVariablePath ?? '/')) {
				const segmentKey = normalizeKey(segment);
				if (!segmentKey || datasetIdentifiers.has(segmentKey)) break;

				currentPathUnderDataset = joinPath(currentPathUnderDataset, segment);
				const folderNode = ensureFolderNode(currentPathUnderDataset);
				attachChildSafe(parent, folderNode, roots);
				parent = folderNode;
			}

			const variableNode = createVariableConfig(datasetRow, variable);
			nodesById.set(variableNode.id, variableNode);
			attachChildSafe(parent, variableNode, roots);
		}

		for (const node of nodesById.values()) {
			if (!node.visibilityDependencyIds?.length) continue;

			node.visibilityDependencyIds = node.visibilityDependencyIds
				.map((dependencyId) => datasetNameToNodeId.get(normalizeKey(dependencyId) ?? ''))
				.filter((dependencyId): dependencyId is string => Boolean(dependencyId));
		}

		sortNodes(roots);
		return roots;
	}
}

function createVariableConfig(
	dataset: DatasetRow,
	variable: DatasetVariableRow
): TreeviewNodeConfig {
	return {
		id: `${dataset.wmId}-${String(variable.tvVariableName)}`,
		name: variable.tvVariableName,
		displayName: variable.tvVariableLabel || undefined,
		treeviewType: dataset.treeviewId ? getNodeTreeviewType(dataset.treeviewId) : TreeviewType.Data,
		type: TreeviewNodeLayerType.Field,
		typology: TreeviewNodeTypology.Variable,
		tags: parseTags(variable.tvTags),
		isEnabled: variable.isEnabled,
		isOpenOnInit: variable.isOpenOnInit,
		isVisibleOnInit: variable.isRenderedOnInit,
		visibilityDependencyIds: variable.hasDependants ?? undefined,
		disableVisibilityToggle: variable.disableRendering,
		visibilityGroupId:
			variable.visibilityGroupId !== null
				? getVisibilityGroupId(variable.visibilityGroupId)
				: undefined,
		isHidden: !variable.isListed,
		order: variable.order,
		metadataTabInfoUrl: variable.tvMetadataConfigUrl || variable.metadataTabInfoUrl || undefined,
		layerId: dataset.wmId || undefined,
		variableId: variable.tvVariableName || undefined,
		children: []
	};
}

function attachChildSafe(
	parent: TreeviewNodeConfig | null,
	child: TreeviewNodeConfig,
	roots: TreeviewNodeConfig[]
): void {
	if (!parent) {
		if (!roots.some((node) => node.id === child.id)) roots.push(child);
		return;
	}

	if (parent === child) {
		console.warn(
			`[ConfigTransformer] Prevented cycle: attempted to attach node "${child.id}" as a child of itself.`
		);
		return;
	}

	parent.children ??= [];
	if (!parent.children.some((node) => node.id === child.id)) {
		parent.children.push(child);
	}
}

function getNodeTypology(tvType: number): TreeviewNodeTypology {
	switch (tvType) {
		case 1:
			return TreeviewNodeTypology.DatasetVector;
		case 2:
			return TreeviewNodeTypology.DatasetRaster;
		case 3:
			return TreeviewNodeTypology.Folder;
		case 5:
			return TreeviewNodeTypology.Area;
		default:
			return TreeviewNodeTypology.Variable;
	}
}

function getNodeType(wmLayerType: number): TreeviewNodeLayerType {
	switch (wmLayerType) {
		case 1:
			return TreeviewNodeLayerType.FeatureLayer;
		case 2:
			return TreeviewNodeLayerType.TileLayer;
		default:
			return TreeviewNodeLayerType.None;
	}
}

function getNodeTreeviewType(treeviewId: number): TreeviewType {
	return treeviewId === 1 ? TreeviewType.Area : TreeviewType.Data;
}

function getVisibilityGroupId(visibilityGroupId: number): string {
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

function parseTags(value: string | null): string[] | undefined {
	if (!value) return undefined;
	const tags = value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
	return tags.length ? tags : undefined;
}

function normalizeKey(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed.toLowerCase() : null;
}

function normalizePath(path: string | null | undefined): string {
	const raw = (path ?? '').trim();
	if (!raw || raw === '/') return '/';
	const cleaned = raw.replace(/\/{2,}/g, '/');
	const noTrailing = cleaned.length > 1 ? cleaned.replace(/\/+$/g, '') : cleaned;
	return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
}

function getPathSegments(path: string | null | undefined): string[] {
	const normalized = normalizePath(path);
	return normalized === '/'
		? []
		: normalized
				.split('/')
				.map((segment) => segment.trim())
				.filter(Boolean);
}

function joinPath(parent: string, segment: string): string {
	const normalizedParent = normalizePath(parent);
	const normalizedSegment = segment.trim().replace(/^\/+|\/+$/g, '');
	if (!normalizedSegment) return normalizedParent;
	return normalizedParent === '/'
		? `/${normalizedSegment}`
		: `${normalizedParent}/${normalizedSegment}`;
}

function lastSegment(fullPath: string): string | null {
	const segments = getPathSegments(fullPath);
	return segments.length ? segments[segments.length - 1] : null;
}

function sortNodes(nodes: TreeviewNodeConfig[]): void {
	nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	for (const node of nodes) {
		if (node.children?.length) sortNodes(node.children);
	}
}
