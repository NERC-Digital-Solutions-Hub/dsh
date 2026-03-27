export interface ArchetypeDefinition {
	id?: number;
	name?: string | null;
}

export interface ArchetypeSummary {
	archetype?: string | null;
	url?: string | null;
}

export interface ArchetypeSummaries {
	summaries?: Record<string, ArchetypeSummary[]> | null;
}

export interface GetArchetypesResponse {
	archetypes?: ArchetypeDefinition[] | null;
}

export interface QueryBoundingBox {
	minLongitude?: number;
	minLatitude?: number;
	maxLongitude?: number;
	maxLatitude?: number;
}

export interface QueryDateRange {
	start?: string | null;
	end?: string | null;
}

export interface QueryPaginationOptions {
	index?: number;
	size?: number;
}

export type QuerySortBy = 0 | 1 | 2 | 3;

export interface QueryRequest {
	searchTerm?: string | null;
	dataTimeSpan?: QueryDateRange;
	dateRange?: QueryDateRange;
	resourceTypes?: string[] | null;
	formats?: string[] | null;
	sortBy?: QuerySortBy;
	isDescending?: boolean;
	pagination?: QueryPaginationOptions;
}

export interface QueryTimespan {
	start?: string | null;
	end?: string | null;
}

export interface QueryValueCount {
	value?: string | null;
	count?: number;
}

export interface ResourceTypeCounts {
	results?: QueryValueCount[] | null;
}

export interface QueryResponsePayload {
	fileIdentifier?: string | null;
	title?: string | null;
	description?: string | null;
	created?: string | null;
	published?: string | null;
	modified?: string | null;
	resourceType?: string | null;
	formats?: string[] | null;
	tags?: string[] | null;
	credits?: string[] | null;
	licences?: string[] | null;
	timespans?: QueryTimespan[] | null;
	boundingBox?: QueryBoundingBox[] | null;
	archetypeSummaries?: ArchetypeSummaries;
}

export interface QueryResponse {
	payload?: QueryResponsePayload[] | null;
}

export interface ValidationProblemDetails {
	type?: string | null;
	title?: string | null;
	status?: number | null;
	detail?: string | null;
	instance?: string | null;
	errors?: Record<string, string[]> | null;
	[key: string]: unknown;
}

export interface AiCatalogueApiEndpoints {
	baseUrl: string;
	getArchetypesRoute: string;
	queryMetadataRoute: string;
	getResourceTypesRoute: string;
	getFormatsRoute: string;
}
