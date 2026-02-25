import type { IConfigurationFetcher } from '$lib/Services/config-api/IConfigurationFetcher';
import type {
	DatasetRow,
	DatasetRowRaw,
	DatasetVariableRow,
	DatasetVariableRowRaw,
	FolderRow,
	FolderRowRaw
} from '$lib/Services/config-api/types';

/**
 * Represents a configuration fetcher that retrieves dataset variable information from CSV files.
 *
 * This fetcher also "completes" the folder configuration by synthesizing missing folder rows
 * that are referenced by:
 *  - Dataset tvPath (folder ancestors leading to a dataset)
 *  - Variable tvVariablePath (folder/dataset segments under a dataset)
 *
 * It is careful to NOT create folders for dataset identifiers (titles/names).
 */
export class CsvConfigFetcher implements IConfigurationFetcher<{
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
	folders: ReadonlyArray<FolderRow>;
}> {
	private readonly datasetUrl: string;
	private readonly variableUrl: string;
	private readonly folderUrl: string;

	/**
	 * Initializes the fetcher with the URLs of the CSV files.
	 *
	 * @param datasetUrl - The URL to the dataset CSV file.
	 * @param variableUrl - The URL to the variable CSV file.
	 * @param folderUrl - The URL to the folder CSV file.
	 */
	constructor(datasetUrl: string, variableUrl: string, folderUrl: string) {
		this.datasetUrl = datasetUrl;
		this.variableUrl = variableUrl;
		this.folderUrl = folderUrl;
	}

	/** @inheritdoc */
	public async fetch(): Promise<{
		datasets: ReadonlyArray<DatasetRow>;
		variables: ReadonlyArray<DatasetVariableRow>;
		folders: ReadonlyArray<FolderRow>;
	}> {
		const [datasets, variables, allFolders] = await Promise.all([
			this.fetchCsv(this.datasetUrl, CsvConfigFetcher.toDatasetRow),
			this.fetchCsv(this.variableUrl, CsvConfigFetcher.toDatasetVariableRow),
			this.fetchCsv(this.folderUrl, CsvConfigFetcher.toFolderRow)
		]);

		// Keep only configured folders with a name; null rows are likely placeholders.
		const configuredFolders = allFolders.filter((folder) => folder.folderName !== null);

		const missingFolders = CsvConfigFetcher.createMissingFolderRows({
			datasets,
			variables,
			existingFolders: configuredFolders,

			/**
			 * If you have specific defaults you want for auto-created folders,
			 * change them here (or pass via constructor/config).
			 */
			defaults: {
				isListed: true,
				isEnabled: true,
				isOpenOnInit: false,
				order: 0,
				tvTitleFromName: true
			},

			/**
			 * Controls whether we log a warning with the missing folders summary.
			 */
			logWarnings: true
		});

		return { datasets, variables, folders: [...configuredFolders, ...missingFolders] };
	}

	private async fetchCsv<T>(
		url: string,
		mapper: (attributes: Record<string, unknown>) => T
	): Promise<T[]> {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(
				`[CsvConfigFetcher] Failed to fetch CSV from ${url}: ${res.status} ${res.statusText}`
			);
		}

		const text = await res.text();
		const rawRows = this.parseCsv(text);
		return rawRows.map(mapper);
	}

	private parseCsv(text: string): Record<string, string>[] {
		// Remove BOM if present
		const cleanText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
		const lines = cleanText.split(/\r?\n/);
		if (lines.length === 0) return [];

		const headerLine = lines[0];
		if (!headerLine.trim()) return [];

		const headers = this.splitCsvLine(headerLine).map((h) => h.trim());
		const result: Record<string, string>[] = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;

			const values = this.splitCsvLine(line);
			const row: Record<string, string> = {};

			for (let j = 0; j < headers.length; j++) {
				const header = headers[j];
				row[header] = values[j] ?? '';
			}
			result.push(row);
		}

		return result;
	}

	private splitCsvLine(line: string): string[] {
		const values: string[] = [];
		let current = '';
		let inQuote = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];

			if (char === '"') {
				if (inQuote && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuote = !inQuote;
				}
			} else if (char === ',' && !inQuote) {
				values.push(current);
				current = '';
			} else {
				current += char;
			}
		}

		values.push(current);
		return values;
	}

	// -------------------- Row mapping (unchanged) --------------------

	private static toDatasetRow(attributes: Record<string, unknown>): DatasetRow {
		const toBoolean = CsvConfigFetcher.toBoolean;
		const toNullableString = CsvConfigFetcher.toNullableString;
		const toNumber = CsvConfigFetcher.toNumber;
		const toArrayOfStrings = CsvConfigFetcher.toArrayOfStrings;
		const get = (key: keyof DatasetRowRaw) => attributes[key];

		const raw: DatasetRowRaw = {
			DbId: toNumber(get('DbId')),
			WmId: String(get('WmId') ?? ''),
			TvTitle: String(get('TvTitle') ?? ''),
			WmLayerType: toNumber(get('WmLayerType') ?? ''),
			WmItemId: String(get('WmItemId') ?? ''),
			WmUrl: String(get('WmUrl') ?? ''),
			DatasetName: toNullableString(get('DatasetName')),
			HasDependants: toArrayOfStrings(get('HasDependants')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			TvType: toNumber(get('TvType') ?? ''),
			TvPath: String(get('TvPath') ?? ''),
			Order: toNumber(get('Order')),
			MetadataId: toNullableString(get('MetadataId')),
			MetadataConfigUrl: toNullableString(get('MetadataConfigUrl')),
			TreeviewId: toNumber(get('TreeviewId')),
			VisibilityGroupId:
				get('VisibilityGroupId') === null ||
				get('VisibilityGroupId') === undefined ||
				get('VisibilityGroupId') === ''
					? null
					: toNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsRenderedOnInit: toBoolean(get('IsRenderedOnInit')),
			DisableRendering: toBoolean(get('DisableRendering'))
		};

		return {
			dbId: raw.DbId,
			wmId: raw.WmId,
			tvTitle: raw.TvTitle,
			wmLayerType: raw.WmLayerType,
			wmItemId: raw.WmItemId,
			wmUrl: raw.WmUrl,
			datasetName: raw.DatasetName,
			hasDependants: raw.HasDependants,
			isListed: raw.IsListed,
			isEnabled: raw.IsEnabled,
			tvType: raw.TvType,
			tvPath: raw.TvPath,
			order: raw.Order,
			metadataId: raw.MetadataId,
			metadataConfigUrl: raw.MetadataConfigUrl,
			treeviewId: raw.TreeviewId,
			visibilityGroupId: raw.VisibilityGroupId,
			isOpenOnInit: raw.IsOpenOnInit,
			isRenderedOnInit: raw.IsRenderedOnInit,
			disableRendering: raw.DisableRendering
		};
	}

	private static toDatasetVariableRow(attributes: Record<string, unknown>): DatasetVariableRow {
		const toBoolean = CsvConfigFetcher.toBoolean;
		const toNullableString = CsvConfigFetcher.toNullableString;
		const toNumber = CsvConfigFetcher.toNumber;
		const toArrayOfStrings = CsvConfigFetcher.toArrayOfStrings;
		const get = (key: keyof DatasetVariableRowRaw) => attributes[key];

		const raw: DatasetVariableRowRaw = {
			DbId: toNumber(get('DbId')),
			DatasetName: toNullableString(get('DatasetName')),
			Order: toNumber(get('Order')),
			TvVariableName: String(get('TvVariableName') ?? ''),
			TvVariableLabel: String(get('TvVariableLabel') ?? ''),
			HasDependants: toArrayOfStrings(get('HasDependants')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			DefaultExported:
				get('DefaultExported') === null ||
				get('DefaultExported') === undefined ||
				get('DefaultExported') === ''
					? null
					: toBoolean(get('DefaultExported')),
			TvVariablePath: toNullableString(get('TvVariablePath')),
			TvTags: toNullableString(get('TvTags')),
			TvMetadataConfigUrl: toNullableString(get('TvMetadataConfigUrl')),
			TreeviewId: toNumber(get('TreeviewId')),
			VisibilityGroupId:
				get('VisibilityGroupId') === null ||
				get('VisibilityGroupId') === undefined ||
				get('VisibilityGroupId') === ''
					? null
					: toNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsRenderedOnInit: toBoolean(get('IsRenderedOnInit')),
			DisableRendering: toBoolean(get('DisableRendering')),
			AlternativeTitle: toNullableString(get('AlternativeTitle')),
			MetadataTabInfoUrl: toNullableString(get('MetadataTabInfoUrl'))
		};

		return {
			dbId: raw.DbId,
			datasetName: raw.DatasetName,
			order: raw.Order,
			tvVariableName: raw.TvVariableName,
			tvVariableLabel: raw.TvVariableLabel,
			hasDependants: raw.HasDependants,
			isListed: raw.IsListed,
			isEnabled: raw.IsEnabled,
			defaultExported: raw.DefaultExported,
			tvVariablePath: raw.TvVariablePath,
			tvTags: raw.TvTags,
			tvMetadataConfigUrl: raw.TvMetadataConfigUrl,
			treeviewId: raw.TreeviewId,
			visibilityGroupId: raw.VisibilityGroupId,
			isOpenOnInit: raw.IsOpenOnInit,
			isRenderedOnInit: raw.IsRenderedOnInit,
			disableRendering: raw.DisableRendering,
			alternativeTitle: raw.AlternativeTitle,
			metadataTabInfoUrl: raw.MetadataTabInfoUrl
		};
	}

	private static toFolderRow(attributes: Record<string, unknown>): FolderRow {
		const toBoolean = CsvConfigFetcher.toBoolean;
		const toNullableString = CsvConfigFetcher.toNullableString;
		const toNumber = CsvConfigFetcher.toNumber;
		const get = (key: keyof FolderRowRaw) => attributes[key];

		const raw: FolderRowRaw = {
			DbId: toNumber(get('DbId')),
			FolderName: toNullableString(get('FolderName')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			TvPath: String(get('TvPath') ?? ''),
			TvTitle: toNullableString(get('TvTitle')),
			Order: toNumber(get('Order')),
			MetadataConfigUrl: toNullableString(get('MetadataConfigUrl')),
			TreeviewId:
				get('TreeviewId') === null || get('TreeviewId') === undefined || get('TreeviewId') === ''
					? null
					: toNumber(get('TreeviewId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			DisabledReason: toNullableString(get('DisabledReason')),
			Description: toNullableString(get('Description'))
		};

		return {
			dbId: raw.DbId,
			folderName: raw.FolderName,
			isListed: raw.IsListed,
			isEnabled: raw.IsEnabled,
			tvPath: raw.TvPath,
			tvTitle: raw.TvTitle,
			order: raw.Order,
			metadataConfigUrl: raw.MetadataConfigUrl,
			treeviewId: raw.TreeviewId,
			isOpenOnInit: raw.IsOpenOnInit,
			disabledReason: raw.DisabledReason,
			description: raw.Description
		};
	}

	// -------------------- Missing folder synthesis (refactor) --------------------

	/**
	 * Options for synthesizing missing folder rows.
	 */
	private static createMissingFolderRows(args: {
		/**
		 * Dataset rows. Used to:
		 *  - create folder ancestors from `tvPath`
		 *  - resolve variables' datasetName -> dataset title and dataset path
		 *  - prevent mistakenly creating folders for dataset identifiers
		 */
		datasets: ReadonlyArray<DatasetRow>;

		/**
		 * Variable rows. Used to create folder rows for segments in `tvVariablePath`.
		 */
		variables: ReadonlyArray<DatasetVariableRow>;

		/**
		 * Existing folder rows coming from the folder CSV (already filtered for folderName != null).
		 */
		existingFolders: ReadonlyArray<FolderRow>;

		/**
		 * Defaults applied to synthesized folders.
		 */
		defaults?: {
			isListed: boolean;
			isEnabled: boolean;
			isOpenOnInit: boolean;
			order: number;
			/**
			 * If true, set tvTitle to folderName for synthesized rows.
			 */
			tvTitleFromName: boolean;
		};

		/**
		 * Whether to log a warning summarizing created folders.
		 */
		logWarnings?: boolean;
	}): FolderRow[] {
		const {
			datasets,
			variables,
			existingFolders,
			defaults = {
				isListed: true,
				isEnabled: true,
				isOpenOnInit: false,
				order: 0,
				tvTitleFromName: true
			},
			logWarnings = true
		} = args;

		// --- Helpers ---

		const normalizePath = (p: string): string => {
			// Convert empty/nullish to "/"
			const raw = (p ?? '').trim();
			if (!raw || raw === '/') return '/';

			// Remove repeated slashes and remove trailing slash (except root)
			const cleaned = raw.replace(/\/{2,}/g, '/');
			const noTrailing = cleaned.length > 1 ? cleaned.replace(/\/+$/g, '') : cleaned;
			return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
		};

		const splitSegments = (p: string): string[] => {
			const norm = normalizePath(p);
			if (norm === '/') return [];
			return norm
				.split('/')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		};

		const joinPath = (parent: string, name: string): string => {
			const p = normalizePath(parent);
			if (p === '/') return `/${name}`;
			return `${p}/${name}`;
		};

		const folderKey = (tvPath: string, folderName: string): string =>
			`${normalizePath(tvPath)}::${folderName}`;

		/**
		 * Adds missing folder rows for each segment in a path, in order.
		 * @param baseParent - parent path to start from (usually "/")
		 * @param segments - folder candidate segments
		 * @param datasetIdentifiers - set of known dataset titles/names (to avoid creating folders for them)
		 */
		const addMissingFromSegments = (
			baseParent: string,
			segments: string[],
			datasetIdentifiers: ReadonlySet<string>
		) => {
			let parentPath = normalizePath(baseParent);

			for (const segment of segments) {
				// Prevent mistakenly creating folders for datasets.
				// We treat dataset "title" and dataset "name" as dataset identifiers.
				if (datasetIdentifiers.has(segment)) {
					// Once we hit a dataset identifier in a generic path, we stop:
					// after a dataset comes either variables or variable paths that should be handled separately.
					// Continuing would almost certainly misclassify segments.
					break;
				}

				const key = folderKey(parentPath, segment);
				if (!knownFolders.has(key) && !createdFolders.has(key)) {
					createdFolders.set(key, {
						dbId: 0,
						folderName: segment,
						isListed: defaults.isListed,
						isEnabled: defaults.isEnabled,
						tvPath: parentPath,
						tvTitle: defaults.tvTitleFromName ? segment : null,
						order: defaults.order,
						metadataConfigUrl: null,
						treeviewId: null,
						isOpenOnInit: defaults.isOpenOnInit,
						disabledReason: null,
						description: null
					});
				}

				parentPath = joinPath(parentPath, segment);
			}
		};

		// --- Build lookup sets/maps ---

		// Existing folder set MUST be path-aware (tvPath + folderName), not name-only.
		const knownFolders = new Set<string>();
		for (const f of existingFolders) {
			if (!f.folderName) continue;
			knownFolders.add(folderKey(f.tvPath, f.folderName));
		}

		// Dataset identifiers used to avoid creating folders for datasets.
		// We include both tvTitle (display title) and datasetName (internal name) to be safe.
		const datasetIdentifiers = new Set<string>();
		for (const d of datasets) {
			if (d.tvTitle?.trim()) datasetIdentifiers.add(d.tvTitle.trim());
			if (d.datasetName?.trim()) datasetIdentifiers.add(d.datasetName.trim());
		}

		// Map datasetName -> dataset row (for variable resolution).
		const datasetByDatasetName = new Map<string, DatasetRow>();
		for (const d of datasets) {
			if (d.datasetName) datasetByDatasetName.set(d.datasetName, d);
		}

		const createdFolders = new Map<string, FolderRow>();

		// --- 1) Create missing folders referenced by datasets' tvPath ---
		for (const dataset of datasets) {
			// dataset.tvPath is the parent path to the dataset.
			const segments = splitSegments(dataset.tvPath);
			addMissingFromSegments('/', segments, datasetIdentifiers);
		}

		// --- 2) Create missing folders referenced by variables' tvVariablePath ---
		for (const variable of variables) {
			// If we can't resolve the dataset, we can't build the full path accurately,
			// so we skip rather than guessing (production safety).
			if (!variable.datasetName) continue;

			const dataset = datasetByDatasetName.get(variable.datasetName);
			if (!dataset) continue;

			// Full dataset path: dataset.tvPath + dataset.tvTitle
			// (Your definition uses TvTitle as the dataset's path segment.)
			const datasetTitle = dataset.tvTitle?.trim();
			if (!datasetTitle) continue;

			const datasetFullPath = joinPath(normalizePath(dataset.tvPath), datasetTitle);

			// TvVariablePath is relative to datasetFullPath.
			const variablePath = variable.tvVariablePath ?? '/';
			const segments = splitSegments(variablePath);

			// Under dataset, segments might still contain dataset identifiers.
			// If we see one, we stop (to avoid misclassifying a dataset as folder).
			addMissingFromSegments(datasetFullPath, segments, datasetIdentifiers);
		}

		if (logWarnings && createdFolders.size > 0) {
			const sample = Array.from(createdFolders.values())
				.slice(0, 50)
				.map((f) => `${normalizePath(f.tvPath)}/${f.folderName}`)
				.join(', ');

			console.warn(
				`[CsvConfigFetcher] Detected ${createdFolders.size} missing folders referenced by datasets/variables. ` +
					`These folders were added with default properties. ` +
					`Sample (up to 50): ${sample}`
			);
		}

		return Array.from(createdFolders.values());
	}

	// -------------------- Helpers --------------------

	private static toBoolean(value: unknown): boolean {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;
		if (typeof value === 'string') {
			const v = value.trim().toLowerCase();
			if (v === 'true' || v === 't' || v === 'yes' || v === 'y' || v === '1') return true;
			if (v === 'false' || v === 'f' || v === 'no' || v === 'n' || v === '0') return false;
		}
		return Boolean(value);
	}

	private static toNullableString(value: unknown): string | null {
		if (value === null || value === undefined) return null;
		const str = String(value).trim();
		return str.length ? str : null;
	}

	private static toNumber(value: unknown, fallback = 0): number {
		if (value === null || value === undefined || value === '') return fallback;
		const n = typeof value === 'number' ? value : Number(value);
		return Number.isFinite(n) ? n : fallback;
	}

	private static toArrayOfStrings(value: unknown): string[] | null {
		if (value === null || value === undefined) return null;
		if (Array.isArray(value)) {
			return value.map((v) => String(v).trim()).filter((s) => s.length > 0);
		}

		const str = String(value).trim();
		return str.length
			? str
					.split(',')
					.map((s) => s.trim().replace('[', '').replace(']', ''))
					.filter((s) => s.length > 0)
			: null;
	}
}
