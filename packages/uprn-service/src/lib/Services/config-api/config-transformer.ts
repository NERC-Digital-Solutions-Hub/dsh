import type { IConfigurationTransformer } from '$lib/Services/config-api/IConfigurationTransformer';
import type { DatasetRow, DatasetVariableRow, FolderRow } from '$lib/Services/config-api/types';
import {
	TreeviewNodeLayerType,
	TreeviewNodeTypology,
	TreeviewType,
	type TreeviewNodeConfig
} from '$lib/Types/treeview';

type Input = {
	folders: ReadonlyArray<FolderRow>;
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
};

/**
 * Builds a hierarchy-preserving tree of TreeviewNodeConfigs from folders/datasets/variables.
 *
 * Key design:
 * - All nodes are addressed by FULL PATH (not just name).
 * - Parent is resolved as the deepest existing folder OR dataset node along the parent path.
 * - Variable paths create folder nodes *under the dataset node*.
 */
export class ConfigTransformer implements IConfigurationTransformer<
	Input,
	ReadonlyArray<TreeviewNodeConfig>
> {
	public async transform(items: Input): Promise<ReadonlyArray<TreeviewNodeConfig>> {
		const { folders, datasets, variables } = items;
		console.debug(
			`[ConfigTransformer] Transforming config with ${folders.length} folders, ${datasets.length} datasets, ${variables.length} variables.`,
			folders,
			datasets,
			variables
		);

		// ---- 1) Build full-path indexes for rows ----
		const folderRowByFullPath = new Map<string, FolderRow>();
		for (const f of folders) {
			if (!f.folderName) continue;
			const fullPath = this.joinPath(this.normalizePath(f.tvPath), f.folderName);
			folderRowByFullPath.set(fullPath, f);
		}

		const datasetRowByFullPath = new Map<string, DatasetRow>();
		const datasetRowByDatasetName = new Map<string, DatasetRow>();
		const datasetIdentifiers = new Set<string>(); // used to avoid misclassifying datasets as folder segments

		for (const d of datasets) {
			if (!d.tvTitle?.trim()) {
				console.warn(
					`[ConfigTransformer] Dataset "${d.wmId}" has empty TvTitle; skipping to avoid path cycles.`
				);
				continue;
			}

			const datasetFullPath = this.joinPath(this.normalizePath(d.tvPath), d.tvTitle);
			datasetRowByFullPath.set(datasetFullPath, d);

			const dn = this.normalizeKey(d.datasetName);
			if (dn) datasetRowByDatasetName.set(dn, d);

			const titleKey = this.normalizeKey(d.tvTitle);
			if (titleKey) datasetIdentifiers.add(titleKey);

			if (dn) datasetIdentifiers.add(dn);
		}

		// ---- 2) Node registry (TreeviewNodeConfig nodes) ----
		const nodeByKey = new Map<string, TreeviewNodeConfig>(); // kind::fullPath -> config
		const roots: TreeviewNodeConfig[] = [];

		const ensureFolderNode = (fullPath: string, row?: FolderRow): TreeviewNodeConfig => {
			const key = `folder::${fullPath}`;
			const existing = nodeByKey.get(key);
			if (existing) return existing;

			const folderName = this.lastSegment(fullPath);
			const cfg: TreeviewNodeConfig = {
				id: `folder:${fullPath}`, // stable & unique
				name: folderName || undefined,
				displayName: row?.tvTitle || folderName || undefined,
				type: TreeviewNodeLayerType.GroupLayer,
				typology: TreeviewNodeTypology.Folder,
				treeviewType: row?.treeviewId
					? this.getNodeTreeviewType(row.treeviewId)
					: TreeviewType.Data,
				isDownloadable: row?.isEnabled ?? false,
				isOpenOnInit: row?.isOpenOnInit ?? false,
				isHidden: row ? !row.isListed : false,
				order: row?.order ?? 0,
				metadataTabInfoUrl: row?.metadataConfigUrl || undefined,
				children: []
			};

			nodeByKey.set(key, cfg);
			return cfg;
		};

		const ensureDatasetNode = (fullPath: string, row: DatasetRow): TreeviewNodeConfig => {
			const key = `dataset::${fullPath}`;
			const existing = nodeByKey.get(key);
			if (existing) return existing;

			// dataset children will be attached later (folders, datasets, variables)
			const cfg: TreeviewNodeConfig = {
				id: row.wmId,
				name: row.tvTitle,
				displayName: row.tvTitle || undefined,
				type: this.getNodeType(row.wmLayerType),
				typology: this.getNodeTypology(row.tvType),
				treeviewType: row.treeviewId ? this.getNodeTreeviewType(row.treeviewId) : TreeviewType.Data,
				isDownloadable: row.isEnabled,
				isOpenOnInit: row.isOpenOnInit,
				isVisibleOnInit: row.isRenderedOnInit,
				disableVisibilityToggle: row.disableRendering,
				visibilityGroupId:
					row.visibilityGroupId !== null
						? this.getVisibilityGroupId(row.visibilityGroupId)
						: undefined,
				isHidden: !row.isListed,
				order: row.order,
				metadataTabInfoUrl: row.metadataConfigUrl || undefined,
				layerId: row.wmId || undefined,
				children: []
			};

			nodeByKey.set(key, cfg);
			return cfg;
		};

		/**
		 * Finds the deepest existing parent node for a given parentPath.
		 * Example:
		 * - parentPath "/A/B/C"
		 * - if dataset "/A/B" exists, that can be a parent
		 * - if folder "/A/B/C" exists, that can be a parent
		 */
		const resolveDeepestParentNode = (parentPath: string): TreeviewNodeConfig | null => {
			const segments = this.getPathSegments(parentPath);
			let current = '/';
			let found: TreeviewNodeConfig | null = null;

			for (const seg of segments) {
				current = this.joinPath(current, seg);

				// Folder node at this path?
				const folderNode = nodeByKey.get(`folder::${current}`);
				if (folderNode) found = folderNode;

				// Dataset node at this path?
				const datasetNode = nodeByKey.get(`dataset::${current}`);
				if (datasetNode) found = datasetNode;
			}

			return found;
		};

		// ---- 3) Materialize ALL folder nodes first (from folder rows) ----
		// This ensures resolveDeepestParentNode can find parents deterministically.
		for (const [fullPath, row] of folderRowByFullPath) {
			ensureFolderNode(fullPath, row);
		}

		// ---- 4) Materialize ALL dataset nodes ----
		for (const [fullPath, row] of datasetRowByFullPath) {
			ensureDatasetNode(fullPath, row);
		}

		// ---- 5) Attach folder nodes to parents ----
		for (const [fullPath, row] of folderRowByFullPath) {
			const parentPath = this.normalizePath(row.tvPath);
			const parent = resolveDeepestParentNode(parentPath);
			const folderNode = ensureFolderNode(fullPath, row);
			this.attachChildSafe(parent, folderNode, roots);
		}

		// ---- 6) Attach dataset nodes to parents (folder OR dataset) ----
		for (const [fullPath, row] of datasetRowByFullPath) {
			const parentPath = this.normalizePath(row.tvPath);
			const parent = resolveDeepestParentNode(parentPath);
			const datasetNode = ensureDatasetNode(fullPath, row);
			this.attachChildSafe(parent, datasetNode, roots);
		}

		// ---- 7) Attach variables, creating variable-folders under dataset based on tvVariablePath ----
		// We also compute datasetByDatasetName -> datasetFullPath so variables can find parent dataset.
		const datasetFullPathByDatasetName = new Map<string, string>();
		for (const [fullPath, row] of datasetRowByFullPath) {
			const dn = this.normalizeKey(row.datasetName);
			if (dn) datasetFullPathByDatasetName.set(dn, fullPath);
		}

		for (const v of variables) {
			const dn = this.normalizeKey(v.datasetName);
			if (!dn) {
				console.warn(
					`[ConfigTransformer] Variable "${v.tvVariableName}" is missing DatasetName and cannot be joined to a dataset.`
				);
				continue;
			}

			const datasetFullPath = datasetFullPathByDatasetName.get(dn);
			if (!datasetFullPath) {
				console.warn(
					`[ConfigTransformer] Orphan variable found with DatasetName: ${v.datasetName}`
				);
				continue;
			}

			const datasetRow = datasetRowByDatasetName.get(dn);
			if (!datasetRow) continue;

			const datasetNode =
				nodeByKey.get(`dataset::${datasetFullPath}`) ??
				ensureDatasetNode(datasetFullPath, datasetRow);

			// Build variable folder chain under dataset node
			const variablePath = this.normalizePath(v.tvVariablePath ?? '/');
			const segments = this.getPathSegments(variablePath);

			let parent: TreeviewNodeConfig = datasetNode;
			let currentPathUnderDataset = datasetFullPath;

			for (const seg of segments) {
				const segKey = this.normalizeKey(seg);
				if (!segKey) continue;

				// If a segment is known to be a dataset identifier, STOP to avoid creating a folder for it.
				if (datasetIdentifiers.has(segKey)) break;

				currentPathUnderDataset = this.joinPath(currentPathUnderDataset, seg);
				const folderNode = ensureFolderNode(currentPathUnderDataset, undefined);
				this.attachChildSafe(parent, folderNode, roots);
				parent = folderNode;
			}

			// Finally attach the variable leaf node
			const variableNode = this.createVariableConfig(datasetRow, v);
			this.attachChildSafe(parent, variableNode, roots);
		}

		// ---- 8) Sort recursively (folders/datasets/variables mixed) ----
		this.sortNodes(roots);
		//console.debug(`[ConfigTransformer] Finished transformation. Resulting tree:`, roots);
		return roots;
	}

	private attachChildSafe(
		parent: TreeviewNodeConfig | null,
		child: TreeviewNodeConfig,
		roots: TreeviewNodeConfig[]
	) {
		if (!parent) {
			// root dedupe by id
			if (!roots.some((n) => n.id === child.id)) roots.push(child);
			return;
		}

		if (parent === child) {
			console.warn(
				`[ConfigTransformer] Prevented cycle: attempted to attach node "${child.id}" as a child of itself.`
			);
			return;
		}

		parent.children = parent.children || [];

		// Dedupe by id (or you could use object identity)
		if (parent.children.some((c) => c.id === child.id)) {
			return;
		}

		parent.children.push(child);
	}

	// -------------------- Variable / typing helpers --------------------

	private createVariableConfig(
		dataset: DatasetRow,
		variable: DatasetVariableRow
	): TreeviewNodeConfig {
		return {
			id: this.getVariableConfigId(dataset.wmId, String(variable.tvVariableName)),
			name: variable.tvVariableName,
			displayName: variable.tvVariableLabel || undefined,
			treeviewType: dataset.treeviewId
				? this.getNodeTreeviewType(dataset.treeviewId)
				: TreeviewType.Data,
			type: TreeviewNodeLayerType.Field,
			typology: TreeviewNodeTypology.Variable,
			isDownloadable: variable.isEnabled,
			isOpenOnInit: variable.isOpenOnInit,
			isVisibleOnInit: variable.isRenderedOnInit,
			disableVisibilityToggle: variable.disableRendering,
			visibilityGroupId:
				variable.visibilityGroupId !== null
					? this.getVisibilityGroupId(variable.visibilityGroupId)
					: undefined,
			isHidden: !variable.isListed,
			order: variable.order,
			metadataTabInfoUrl: variable.metadataTabInfoUrl || undefined,
			layerId: dataset.wmId || undefined,
			variableId: variable.tvVariableName || undefined,
			children: []
		};
	}

	private getNodeTypology(tvType: number): TreeviewNodeTypology {
		switch (tvType) {
			case 1:
				return TreeviewNodeTypology.DatasetVector;
			case 2:
				return TreeviewNodeTypology.DatasetRaster;
			case 3:
				return TreeviewNodeTypology.Folder;
			case 4:
				return TreeviewNodeTypology.Variable;
			case 5:
				return TreeviewNodeTypology.Area;
			default:
				return TreeviewNodeTypology.Variable;
		}
	}

	private getNodeType(wmLayerType: number): TreeviewNodeLayerType {
		switch (wmLayerType) {
			case 1:
				return TreeviewNodeLayerType.FeatureLayer;
			case 2:
				return TreeviewNodeLayerType.TileLayer;
			default:
				return TreeviewNodeLayerType.None;
		}
	}

	private getNodeTreeviewType(treeviewId: number): TreeviewType {
		switch (treeviewId) {
			case 1:
				return TreeviewType.Area;
			case 2:
				return TreeviewType.Data;
			default:
				return TreeviewType.Data;
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

	// -------------------- Path + normalization helpers (full-path safe) --------------------

	private normalizeKey(value: string | null | undefined): string | null {
		const v = value?.trim();
		return v ? v.toLowerCase() : null;
	}

	private normalizePath(path: string | null | undefined): string {
		const raw = (path ?? '').trim();
		if (!raw || raw === '/') return '/';
		const cleaned = raw.replace(/\/{2,}/g, '/');
		const noTrailing = cleaned.length > 1 ? cleaned.replace(/\/+$/g, '') : cleaned;
		return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
	}

	private getPathSegments(path: string | null | undefined): string[] {
		const p = this.normalizePath(path);
		if (p === '/') return [];
		return p
			.split('/')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	private joinPath(parent: string, segment: string): string {
		const p = this.normalizePath(parent);
		const s = segment.trim().replace(/^\/+|\/+$/g, '');
		if (!s) return p;
		return p === '/' ? `/${s}` : `${p}/${s}`;
	}

	private lastSegment(fullPath: string): string | null {
		const segs = this.getPathSegments(fullPath);
		return segs.length ? segs[segs.length - 1] : null;
	}

	// -------------------- Sorting --------------------

	private sortNodes(nodes: TreeviewNodeConfig[]) {
		nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		for (const node of nodes) {
			if (node.children && node.children.length > 0) {
				this.sortNodes(node.children);
			}
		}
	}
}
