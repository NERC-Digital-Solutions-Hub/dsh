/**
 * Configuration for metadata API endpoints
 */
export interface MetadataEndpoint {
	name: string;
	queryMetadataCommon: {
		name: string;
	};
	keywords: {
		name: string;
	};
	topics: {
		name: string;
	};
}

/**
 * Request object for metadata search criteria
 */
export interface MetadataSearchCriteriaRequest {
	searchTerm?: string;
	publicationDateRange?: DateRangeRequest;
	topics?: string[];
	keywords?: string[];
	resourceType?: string;
	formats?: string[];
	boundingBox?: number[];
	paginationOptions?: PaginationOptions;
	sortByCriteria?: string;
	isAscending?: boolean;
}

/**
 * Request object for date range filtering
 */
export interface DateRangeRequest {
	start?: string | null; // ISO date string
	end?: string | null; // ISO date string
}

export interface MetadataCommonQueryResponse {
	totalCount: number;
	returnedCount: number;
	records: MetadataCommonDto[];
}

/**
 * Common metadata DTO response object
 */
export interface MetadataCommonDto {
	fileIdentifier: string;
	title: string;
	abstract: string;
	publicationDate: string | null; // ISO date string
	revisionDate: string | null; // ISO date string
	keywords: string[];
	topics: string[];
	boundingBox?: BoundingBoxDto;
	resourceType: string;
	resourceContact: string;
	updateFrequency: string;
	representationType: string;
	downloadUrl: string | null;
	downloadFunctionCode: string | null;
	supportingDocumentsUrl: string | null;
	formats: string[];
	spatialResolutions: string[];
}

/**
 * Bounding box response object
 */
export interface BoundingBoxDto {
	westBoundLongitude: number;
	eastBoundLongitude: number;
	southBoundLatitude: number;
	northBoundLatitude: number;
}

/**
 * Keyword DTO response object
 */
export interface KeywordDto {
	name: string;
	count: number;
}

/**
 * Topic DTO response object
 */
export interface TopicDto {
	name: string;
	count: number;
}

/**
 * Configuration for the metadata service
 */
export interface MetadataServiceConfig {
	baseUrl: string;
	endpoints: MetadataEndpoint;
}

/**
 * Error response from the API
 */
export interface ApiError {
	message: string;
	status: number;
	details?: string | Record<string, unknown>;
}

export interface PaginationOptions {
	pageNumber: number;
	pageSize: number;
}

export interface ValueCount {
	value: string;
	count: number;
}
