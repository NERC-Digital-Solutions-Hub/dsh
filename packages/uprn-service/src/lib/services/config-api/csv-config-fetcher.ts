import type { IConfigurationFetcher } from '$lib/services/config-api/IConfigurationFetcher';
import type {
	DatasetRow,
	DatasetRowRaw,
	DatasetVariableRow,
	DatasetVariableRowRaw
} from '$lib/services/config-api/types';

/**
 * Represents a configuration fetcher that retrieves dataset variable information from a CSV file.
 */
export class CsvConfigFetcher implements IConfigurationFetcher<{
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
}> {
	private readonly datasetUrl: string;
	private readonly variableUrl: string;

	/**
	 * Initializes the fetcher with the URLs of the CSV files.
	 * @param datasetUrl The url to the dataset CSV file.
	 * @param variableUrl The url to the variable CSV file.
	 */
	constructor(datasetUrl: string, variableUrl: string) {
		this.datasetUrl = datasetUrl;
		this.variableUrl = variableUrl;
	}

	/** @inheritdoc */
	public async fetch(): Promise<{
		datasets: ReadonlyArray<DatasetRow>;
		variables: ReadonlyArray<DatasetVariableRow>;
	}> {
		const [datasets, variables] = await Promise.all([
			this.fetchCsv(this.datasetUrl, CsvConfigFetcher.toDatasetRow),
			this.fetchCsv(this.variableUrl, CsvConfigFetcher.toDatasetVariableRow)
		]);

		return { datasets, variables };
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

		// Parse headers
		// Assuming headers do not contain commas or quotes for simplicity,
		// but using the splitter just in case.
		const headerLine = lines[0];
		if (!headerLine.trim()) return [];

		const headers = this.splitCsvLine(headerLine).map((h) => h.trim());
		const result: Record<string, string>[] = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;

			const values = this.splitCsvLine(line);
			const row: Record<string, string> = {};

			// Map values to headers
			for (let j = 0; j < headers.length; j++) {
				const header = headers[j];
				// Accessing by index for safety, defaulting to empty string
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
				// Check for escaped quote ("")
				if (inQuote && line[i + 1] === '"') {
					current += '"';
					i++; // Skip the next quote
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
		const toBoolean = CsvConfigFetcher.toBoolean;
		const toNullableString = CsvConfigFetcher.toNullableString;
		const toNumber = CsvConfigFetcher.toNumber;
		const toArrayOfStrings = CsvConfigFetcher.toArrayOfStrings;
		const get = (key: keyof DatasetRowRaw) => attributes[key];

		const raw: DatasetRowRaw = {
			DbId: toNumber(get('DbId')),
			WmId: String(get('WmId') ?? ''),
			WmTitle: String(get('WmTitle') ?? ''),
			WmLayerType: String(get('WmLayerType') ?? ''),
			WmItemId: String(get('WmItemId') ?? ''),
			WmUrl: String(get('WmUrl') ?? ''),
			DatasetName: toNullableString(get('DatasetName')),
			HasDependants: toArrayOfStrings(get('HasDependants')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			TvType: String(get('TvType') ?? ''),
			TvPath: String(get('TvPath') ?? ''),
			Order: toNumber(get('Order')),
			MetadataId: toNullableString(get('MetadataId')),
			MetadataUrl: toNullableString(get('MetadataUrl')),
			TreeviewId: toNullableString(get('TreeviewId')),
			VisibilityGroupId:
				get('VisibilityGroupId') === null ||
				get('VisibilityGroupId') === undefined ||
				get('VisibilityGroupId') === ''
					? null
					: toNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsVisibleOnInit: toBoolean(get('IsVisibleOnInit')),
			DisableVisibility: toBoolean(get('DisableVisibility')),
			AlternativeTitle: toNullableString(get('AlternativeTitle')),
			MetadataTabInfoUrl: toNullableString(get('MetadataTabInfoUrl'))
		};

		return {
			dbId: raw.DbId,
			wmId: raw.WmId,
			wmTitle: raw.WmTitle,
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
			metadataUrl: raw.MetadataUrl,
			treeviewId: raw.TreeviewId,
			visibilityGroupId: raw.VisibilityGroupId,
			isOpenOnInit: raw.IsOpenOnInit,
			isVisibleOnInit: raw.IsVisibleOnInit,
			disableVisibility: raw.DisableVisibility,
			alternativeTitle: raw.AlternativeTitle,
			metadataTabInfoUrl: raw.MetadataTabInfoUrl
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
			WmId: String(get('WmId') ?? ''),
			WmTitle: String(get('WmTitle') ?? ''),
			WmLayerType: String(get('WmLayerType') ?? ''),
			WmItemId: String(get('WmItemId') ?? ''),
			WmUrl: String(get('WmUrl') ?? ''),
			DatasetName: toNullableString(get('DatasetName')),
			TvType: String(get('TvType') ?? ''),
			TvPath: String(get('TvPath') ?? ''),
			Order: toNumber(get('Order')),
			VariableName: String(get('VariableName') ?? ''),
			VariableLabel: String(get('VariableLabel') ?? ''),
			HasDependants: toArrayOfStrings(get('HasDependants')),
			IsListed: toBoolean(get('IsListed')),
			IsEnabled: toBoolean(get('IsEnabled')),
			DefaultExported:
				get('DefaultExported') === null ||
				get('DefaultExported') === undefined ||
				get('DefaultExported') === ''
					? null
					: toBoolean(get('DefaultExported')),
			TvFieldPath: toNullableString(get('TvFieldPath')),
			TvTags: toNullableString(get('TvTags')),
			TvMetadataUrl: toNullableString(get('TvMetadataUrl')),
			TreeviewId: toNullableString(get('TreeviewId')),
			VisibilityGroupId:
				get('VisibilityGroupId') === null ||
				get('VisibilityGroupId') === undefined ||
				get('VisibilityGroupId') === ''
					? null
					: toNumber(get('VisibilityGroupId')),
			IsOpenOnInit: toBoolean(get('IsOpenOnInit')),
			IsVisibleOnInit: toBoolean(get('IsVisibleOnInit')),
			DisableVisibility: toBoolean(get('DisableVisibility')),
			AlternativeTitle: toNullableString(get('AlternativeTitle')),
			MetadataTabInfoUrl: toNullableString(get('MetadataTabInfoUrl'))
		};

		return {
			dbId: raw.DbId,
			wmId: raw.WmId,
			wmTitle: raw.WmTitle,
			wmLayerType: raw.WmLayerType,
			wmItemId: raw.WmItemId,
			wmUrl: raw.WmUrl,
			datasetName: raw.DatasetName,
			tvType: raw.TvType,
			tvPath: raw.TvPath,
			order: raw.Order,
			variableName: raw.VariableName,
			variableLabel: raw.VariableLabel,
			hasDependants: raw.HasDependants,
			isListed: raw.IsListed,
			isEnabled: raw.IsEnabled,
			defaultExported: raw.DefaultExported,
			tvFieldPath: raw.TvFieldPath,
			tvTags: raw.TvTags,
			tvMetadataUrl: raw.TvMetadataUrl,
			treeviewId: raw.TreeviewId,
			visibilityGroupId: raw.VisibilityGroupId,
			isOpenOnInit: raw.IsOpenOnInit,
			isVisibleOnInit: raw.IsVisibleOnInit,
			disableVisibility: raw.DisableVisibility,
			alternativeTitle: raw.AlternativeTitle,
			metadataTabInfoUrl: raw.MetadataTabInfoUrl
		};
	}

	// Helper functions as static properties/methods to be accessible
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
