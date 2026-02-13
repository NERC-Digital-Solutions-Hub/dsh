import type { IConfigurationFetcher } from '$lib/services/config-api/IConfigurationFetcher';
import type {
	DatasetRow,
	DatasetRowRaw,
	DatasetVariableRow,
	DatasetVariableRowRaw
} from '$lib/services/config-api/types';

type ArcGISError = {
	message: string;
	details?: string[];
};

type ArcGISLayerInfoResponse = {
	maxRecordCount?: number;
	error?: ArcGISError;
};

type ArcGISQueryFeature<TAttributes> = {
	attributes: TAttributes;
};

type ArcGISQueryResponse<TAttributes> = {
	features?: Array<ArcGISQueryFeature<TAttributes>>;
	exceededTransferLimit?: boolean;
	error?: ArcGISError;
};

/**
 * Represents a configuration fetcher that retrieves dataset variable information from an ArcGIS
 * feature service layer.
 */
export class ArcGISConfigFetcher implements IConfigurationFetcher<{
	datasets: ReadonlyArray<DatasetRow>;
	variables: ReadonlyArray<DatasetVariableRow>;
}> {
	private readonly datasetUrl: string;
	private readonly variableUrl: string;

	/**
	 * Initializes the fetcher with the base URLs of the ArcGIS feature service layers.
	 * @param datasetUrl The url to the dataset feature server.
	 * @param variableUrl The url to the variable feature server.
	 */
	constructor(datasetUrl: string, variableUrl: string) {
		this.datasetUrl = ArcGISConfigFetcher.normalizeBaseUrl(datasetUrl);
		this.variableUrl = ArcGISConfigFetcher.normalizeBaseUrl(variableUrl);
	}

	/** @inheritdoc */
	public async fetch(): Promise<{
		datasets: ReadonlyArray<DatasetRow>;
		variables: ReadonlyArray<DatasetVariableRow>;
	}> {
		const [datasets, variables] = await Promise.all([
			this.fetchTable<DatasetRowRaw, DatasetRow>(this.datasetUrl, ArcGISConfigFetcher.toDatasetRow),
			this.fetchTable<DatasetVariableRowRaw, DatasetVariableRow>(
				this.variableUrl,
				ArcGISConfigFetcher.toDatasetVariableRow
			)
		]);

		return { datasets, variables };
	}

	private async fetchTable<TRaw, TOut>(
		baseUrl: string,
		mapper: (raw: TRaw) => TOut
	): Promise<Array<TOut>> {
		const pageSize = await this.getMaxRecordCount(baseUrl);
		const rows: TOut[] = [];

		let resultOffset = 0;
		while (true) {
			const response = await this.queryPage<TRaw>(baseUrl, resultOffset, pageSize);
			const features = response.features ?? [];

			for (const feature of features) {
				rows.push(mapper(feature.attributes));
			}

			if (features.length === 0) {
				break;
			}

			const shouldContinue =
				response.exceededTransferLimit === true || (features.length === pageSize && pageSize > 0);
			if (!shouldContinue) {
				break;
			}

			resultOffset += features.length;
		}

		return rows;
	}

	private async getMaxRecordCount(baseUrl: string): Promise<number> {
		const url = new URL(baseUrl);
		url.searchParams.set('f', 'json');

		const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
		if (!res.ok) {
			throw new Error(
				`[ArcGISConfigFetcher] Failed to fetch layer info from ${baseUrl}: ${res.status} ${res.statusText}`
			);
		}

		const info = (await res.json()) as ArcGISLayerInfoResponse;
		if (info.error) {
			throw new Error(
				`[ArcGISConfigFetcher] ArcGIS error from ${baseUrl}: ${info.error.message}${
					info.error.details?.length ? ` (${info.error.details.join('; ')})` : ''
				}`
			);
		}

		const max = typeof info.maxRecordCount === 'number' ? info.maxRecordCount : 2000;
		return Number.isFinite(max) && max > 0 ? max : 2000;
	}

	private async queryPage<TAttributes>(
		baseUrl: string,
		resultOffset: number,
		resultRecordCount: number
	): Promise<ArcGISQueryResponse<TAttributes>> {
		const url = new URL(`${baseUrl}/query`);
		url.searchParams.set('f', 'json');
		url.searchParams.set('where', '1=1');
		url.searchParams.set('outFields', '*');
		url.searchParams.set('returnGeometry', 'false');
		url.searchParams.set('resultOffset', String(resultOffset));
		url.searchParams.set('resultRecordCount', String(resultRecordCount));

		const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
		if (!res.ok) {
			throw new Error(
				`[ArcGISConfigFetcher] Query failed for ${baseUrl}: ${res.status} ${res.statusText}`
			);
		}

		const data = (await res.json()) as ArcGISQueryResponse<TAttributes>;
		if (data.error) {
			throw new Error(
				`[ArcGISConfigFetcher] ArcGIS error for ${baseUrl}: ${data.error.message}${
					data.error.details?.length ? ` (${data.error.details.join('; ')})` : ''
				}`
			);
		}

		return data;
	}

	private static normalizeBaseUrl(apiUrl: string): string {
		// Remove trailing slashes and (if passed) a trailing /query.
		let normalized = apiUrl.trim().replace(/\/+$/, '');
		if (normalized.toLowerCase().endsWith('/query')) {
			normalized = normalized.slice(0, -'/query'.length);
		}
		return normalized;
	}

	private static toDatasetRow(attributes: DatasetRowRaw): DatasetRow {
		const toBoolean = ArcGISConfigFetcher.toBoolean;
		const toNullableString = ArcGISConfigFetcher.toNullableString;
		const toNumber = ArcGISConfigFetcher.toNumber;

		const raw: DatasetRowRaw = {
			DbId: toNumber(attributes.DbId),
			WmId: String(attributes.WmId ?? ''),
			WmTitle: String(attributes.WmTitle ?? ''),
			WmLayerType: String(attributes.WmLayerType ?? ''),
			WmItemId: String(attributes.WmItemId ?? ''),
			WmUrl: String(attributes.WmUrl ?? ''),
			DatasetName: toNullableString(attributes.DatasetName),
			HasDependants: this.toArrayOfStrings(attributes.HasDependants),
			IsListed: toBoolean(attributes.IsListed),
			IsEnabled: toBoolean(attributes.IsEnabled),
			TvType: String(attributes.TvType ?? ''),
			TvPath: String(attributes.TvPath ?? ''),
			Order: toNumber(attributes.Order),
			MetadataId: toNullableString(attributes.MetadataId),
			MetadataUrl: toNullableString(attributes.MetadataUrl),
			TreeviewId: toNullableString(attributes.TreeviewId),
			VisibilityGroupId: toNumber(attributes.VisibilityGroupId),
			IsOpenOnInit: toBoolean(attributes.IsOpenOnInit),
			IsVisibleOnInit: toBoolean(attributes.IsVisibleOnInit),
			DisableVisibility: toBoolean(attributes.DisableVisibility),
			AlternativeTitle: toNullableString(attributes.AlternativeTitle),
			MetadataTabInfoUrl: toNullableString(attributes.MetadataTabInfoUrl)
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

	private static toDatasetVariableRow(attributes: DatasetVariableRowRaw): DatasetVariableRow {
		const toBoolean = ArcGISConfigFetcher.toBoolean;
		const toNullableString = ArcGISConfigFetcher.toNullableString;
		const toNumber = ArcGISConfigFetcher.toNumber;

		const raw: DatasetVariableRowRaw = {
			DbId: toNumber(attributes.DbId),
			WmId: String(attributes.WmId ?? ''),
			WmTitle: String(attributes.WmTitle ?? ''),
			WmLayerType: String(attributes.WmLayerType ?? ''),
			WmItemId: String(attributes.WmItemId ?? ''),
			WmUrl: String(attributes.WmUrl ?? ''),
			DatasetName: toNullableString(attributes.DatasetName),
			TvType: String(attributes.TvType ?? ''),
			TvPath: String(attributes.TvPath ?? ''),
			Order: toNumber(attributes.Order),
			VariableName: String(attributes.VariableName ?? ''),
			VariableLabel: String(attributes.VariableLabel ?? ''),
			HasDependants: this.toArrayOfStrings(attributes.HasDependants),
			IsListed: toBoolean(attributes.IsListed),
			IsEnabled: toBoolean(attributes.IsEnabled),
			DefaultExported:
				attributes.DefaultExported === null || attributes.DefaultExported === undefined
					? null
					: toBoolean(attributes.DefaultExported),
			TvFieldPath: toNullableString(attributes.TvFieldPath),
			TvTags: toNullableString(attributes.TvTags),
			TvMetadataUrl: toNullableString(attributes.TvMetadataUrl),
			TreeviewId: toNullableString(attributes.TreeviewId),
			VisibilityGroupId: toNumber(attributes.VisibilityGroupId),
			IsOpenOnInit: toBoolean(attributes.IsOpenOnInit),
			IsVisibleOnInit: toBoolean(attributes.IsVisibleOnInit),
			DisableVisibility: toBoolean(attributes.DisableVisibility),
			AlternativeTitle: toNullableString(attributes.AlternativeTitle),
			MetadataTabInfoUrl: toNullableString(attributes.MetadataTabInfoUrl)
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

	// Helper functions made static to be shared
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
