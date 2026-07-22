import type {
	DatasetRow,
	DatasetRowRaw,
	DatasetVariableRow,
	DatasetVariableRowRaw,
	FolderRow,
	FolderRowRaw
} from './types';

export type UprnCsvConfig = {
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
	folders: ReadonlyArray<FolderRow>;
};

export class CsvConfigFetcher {
	constructor(
		private readonly datasetUrl: string,
		private readonly variableUrl: string,
		private readonly folderUrl: string,
		private readonly fetchImpl: typeof fetch = fetch
	) {}

	public async fetch(): Promise<UprnCsvConfig> {
		const [datasets, variables, folders] = await Promise.all([
			this.fetchCsv(this.datasetUrl, CsvConfigFetcher.toDatasetRow),
			this.fetchCsv(this.variableUrl, CsvConfigFetcher.toDatasetVariableRow),
			this.fetchCsv(this.folderUrl, CsvConfigFetcher.toFolderRow)
		]);
		const configuredFolders = folders.filter((folder) => folder.folderName !== null);

		return {
			datasets,
			variables,
			folders: [
				...configuredFolders,
				...CsvConfigFetcher.createMissingFolderRows(datasets, variables, configuredFolders)
			]
		};
	}

	private async fetchCsv<T>(
		url: string,
		mapper: (attributes: Record<string, unknown>) => T
	): Promise<T[]> {
		const response = await this.fetchImpl(url);
		if (!response.ok) {
			throw new Error(
				`[CsvConfigFetcher] Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`
			);
		}

		return this.parseCsv(await response.text()).map(mapper);
	}

	private parseCsv(text: string): Record<string, string>[] {
		const cleanText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
		const lines = cleanText.split(/\r?\n/);
		const headerLine = lines[0];
		if (!headerLine?.trim()) {
			return [];
		}

		const headers = this.splitCsvLine(headerLine).map((header) => header.trim());
		return lines
			.slice(1)
			.filter((line) => line.trim())
			.map((line) => {
				const values = this.splitCsvLine(line);
				return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
			});
	}

	private splitCsvLine(line: string): string[] {
		const values: string[] = [];
		let current = '';
		let inQuote = false;

		for (let index = 0; index < line.length; index += 1) {
			const char = line[index];
			if (char === '"') {
				if (inQuote && line[index + 1] === '"') {
					current += '"';
					index += 1;
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

	private static toDatasetRow(attributes: Record<string, unknown>): DatasetRow {
		const get = (key: keyof DatasetRowRaw) => attributes[key];
		const raw: DatasetRowRaw = {
			DbId: toNumber(get('DbId')),
			WmId: String(get('WmId') ?? ''),
			TvTitle: String(get('TvTitle') ?? ''),
			WmLayerType: toNumber(get('WmLayerType')),
			WmItemId: String(get('WmItemId') ?? ''),
			WmUrl: String(get('WmUrl') ?? ''),
			DatasetName: toNullableString(get('DatasetName')),
			HasDependants: toArrayOfStrings(get('HasDependants')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			TvType: toNumber(get('TvType')),
			TvPath: String(get('TvPath') ?? ''),
			Order: toNumber(get('Order')),
			MetadataId: toNullableString(get('MetadataId')),
			MetadataConfigUrl: toNullableString(get('MetadataConfigUrl')),
			TreeviewId: toNullableNumber(get('TreeviewId')),
			VisibilityGroupId: toNullableNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsRenderedOnInit: toBoolean(get('IsRenderedOnInit')),
			DisableRendering: toBoolean(get('DisableRendering')),
			DisabledReason: toNullableString(get('DisabledReason'))
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
			disableRendering: raw.DisableRendering,
			disabledReason: raw.DisabledReason
		};
	}

	private static toDatasetVariableRow(attributes: Record<string, unknown>): DatasetVariableRow {
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
			DefaultExported: toNullableBoolean(get('DefaultExported')),
			TvVariablePath: toNullableString(get('TvVariablePath')),
			TvTags: toNullableString(get('TvTags')),
			TvMetadataConfigUrl: toNullableString(get('TvMetadataConfigUrl')),
			TreeviewId: toNullableNumber(get('TreeviewId')),
			VisibilityGroupId: toNullableNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsRenderedOnInit: toBoolean(get('IsRenderedOnInit')),
			DisableRendering: toBoolean(get('DisableRendering')),
			DisabledReason: toNullableString(get('DisabledReason')),
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
			disabledReason: raw.DisabledReason,
			alternativeTitle: raw.AlternativeTitle,
			metadataTabInfoUrl: raw.MetadataTabInfoUrl
		};
	}

	private static toFolderRow(attributes: Record<string, unknown>): FolderRow {
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
			TreeviewId: toNullableNumber(get('TreeviewId')),
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

	private static createMissingFolderRows(
		datasets: ReadonlyArray<DatasetRow>,
		variables: ReadonlyArray<DatasetVariableRow>,
		existingFolders: ReadonlyArray<FolderRow>
	): FolderRow[] {
		const knownFolders = new Set(
			existingFolders
				.filter((folder) => folder.folderName)
				.map((folder) => folderKey(folder.tvPath, folder.folderName!))
		);
		const createdFolders = new Map<string, FolderRow>();
		const datasetIdentifiers = new Set<string>();
		const datasetByName = new Map<string, DatasetRow>();

		for (const dataset of datasets) {
			if (dataset.tvTitle.trim()) datasetIdentifiers.add(dataset.tvTitle.trim());
			if (dataset.datasetName?.trim()) {
				datasetIdentifiers.add(dataset.datasetName.trim());
				datasetByName.set(dataset.datasetName, dataset);
			}
		}

		const addMissingFromSegments = (baseParent: string, segments: string[]) => {
			let parentPath = normalizePath(baseParent);
			for (const segment of segments) {
				if (datasetIdentifiers.has(segment)) break;

				const key = folderKey(parentPath, segment);
				if (!knownFolders.has(key) && !createdFolders.has(key)) {
					createdFolders.set(key, {
						dbId: 0,
						folderName: segment,
						isListed: true,
						isEnabled: true,
						tvPath: parentPath,
						tvTitle: segment,
						order: 0,
						metadataConfigUrl: null,
						treeviewId: null,
						isOpenOnInit: false,
						disabledReason: null,
						description: null
					});
				}
				parentPath = joinPath(parentPath, segment);
			}
		};

		for (const dataset of datasets) {
			addMissingFromSegments('/', splitSegments(dataset.tvPath));
		}

		for (const variable of variables) {
			if (!variable.datasetName) continue;
			const dataset = datasetByName.get(variable.datasetName);
			if (!dataset?.tvTitle.trim()) continue;

			addMissingFromSegments(
				joinPath(normalizePath(dataset.tvPath), dataset.tvTitle.trim()),
				splitSegments(variable.tvVariablePath ?? '/')
			);
		}

		return [...createdFolders.values()];
	}
}

function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return value !== 0;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', 't', 'yes', 'y', '1'].includes(normalized)) return true;
		if (['false', 'f', 'no', 'n', '0'].includes(normalized)) return false;
	}
	return Boolean(value);
}

function toNullableBoolean(value: unknown): boolean | null {
	return isBlank(value) ? null : toBoolean(value);
}

function toNullableString(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	const stringValue = String(value).trim();
	return stringValue.length ? stringValue : null;
}

function toNumber(value: unknown, fallback = 0): number {
	if (isBlank(value)) return fallback;
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
	return isBlank(value) ? null : toNumber(value);
}

function toArrayOfStrings(value: unknown): string[] | null {
	if (isBlank(value)) return null;
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter(Boolean);
	}

	const values = String(value)
		.trim()
		.split(',')
		.map((item) => item.trim().replace('[', '').replace(']', ''))
		.filter(Boolean);
	return values.length ? values : null;
}

function isBlank(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

function folderKey(tvPath: string, folderName: string): string {
	return `${normalizePath(tvPath)}::${folderName}`;
}

function splitSegments(path: string): string[] {
	const normalized = normalizePath(path);
	return normalized === '/'
		? []
		: normalized
				.split('/')
				.map((part) => part.trim())
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

function normalizePath(path: string | null | undefined): string {
	const raw = (path ?? '').trim();
	if (!raw || raw === '/') return '/';
	const cleaned = raw.replace(/\/{2,}/g, '/');
	const noTrailing = cleaned.length > 1 ? cleaned.replace(/\/+$/g, '') : cleaned;
	return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
}
