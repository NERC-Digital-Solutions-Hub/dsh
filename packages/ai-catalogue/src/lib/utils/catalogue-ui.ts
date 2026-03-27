import type { QueryBoundingBox, QueryResponsePayload } from '$lib/types/api.types';
import type { ValueCount } from '$lib/types/metadata';

const PLACEHOLDER_FORMATS = ['API', 'CSV', 'GeoJSON', 'JSON', 'Web Map'] as const;

export enum SortByCriteria {
	Relevance = '0',
	Title = '1',
	PublicationDate = '2',
	RevisionDate = '3'
}

export interface CatalogueResultCardRecord {
	fileIdentifier: string;
	title: string;
	abstract: string;
	publicationDate: string | null;
	revisionDate: string | null;
	boundingBox?: {
		westBoundLongitude: number;
		eastBoundLongitude: number;
		southBoundLatitude: number;
		northBoundLatitude: number;
	};
	resourceType: string;
	formats: string[];
	relevanceRank: number;
	detailItem: CatalogueItemDetail;
}

export interface CatalogueArchetypeLink {
	group: string;
	label: string;
	url: string;
}

export interface CatalogueItemDetail {
	fileIdentifier: string;
	title: string;
	description: string;
	publicationDate: string | null;
	revisionDate: string | null;
	createdDate: string | null;
	resourceType: string;
	formats: string[];
	tags: string[];
	credits: string[];
	licences: string[];
	boundingBox?: CatalogueResultCardRecord['boundingBox'];
	timespans: Array<{
		start: string | null;
		end: string | null;
		label: string;
	}>;
	archetypeLinks: CatalogueArchetypeLink[];
}

export interface CatalogueViewFilters {
	searchTerm: string;
	startDate: string | null;
	endDate: string | null;
	selectedResourceTypes: string[];
	selectedFormats: string[];
	sortBy: SortByCriteria;
	isAscending: boolean;
}

export function adaptQueryRecords(records: QueryResponsePayload[]): CatalogueResultCardRecord[] {
	return records.map((record, index) => ({
		fileIdentifier: record.fileIdentifier ?? `record-${index + 1}`,
		title: record.title?.trim() || 'Untitled resource',
		abstract: buildAbstract(record),
		publicationDate: record.published ?? record.created ?? null,
		revisionDate: record.modified ?? record.created ?? null,
		boundingBox: toLegacyBoundingBox(record.boundingBox?.[0]),
		resourceType: record.resourceType?.trim() || 'Dataset',
		formats: buildPlaceholderFormats(record),
		relevanceRank: index,
		detailItem: adaptQueryRecordToDetail(record, index)
	}));
}

export function buildResourceTypeCounts(records: CatalogueResultCardRecord[]): ValueCount[] {
	return buildValueCounts(records.map((record) => record.resourceType));
}

export function buildFormatCounts(records: CatalogueResultCardRecord[]): ValueCount[] {
	return buildValueCounts(records.flatMap((record) => record.formats));
}

export function adaptQueryRecordToDetail(
	record: QueryResponsePayload,
	index = 0
): CatalogueItemDetail {
	return {
		fileIdentifier: record.fileIdentifier ?? `record-${index + 1}`,
		title: record.title?.trim() || 'Untitled resource',
		description: buildAbstract(record),
		publicationDate: record.published ?? record.created ?? null,
		revisionDate: record.modified ?? record.created ?? null,
		createdDate: record.created ?? null,
		resourceType: record.resourceType?.trim() || 'Dataset',
		formats: buildPlaceholderFormats(record),
		tags: record.tags ?? [],
		credits: record.credits ?? [],
		licences: record.licences ?? [],
		boundingBox: toLegacyBoundingBox(record.boundingBox?.[0]),
		timespans: (record.timespans ?? []).map((timespan) => ({
			start: timespan.start ?? null,
			end: timespan.end ?? null,
			label: formatTimespan(timespan.start ?? null, timespan.end ?? null)
		})),
		archetypeLinks: buildArchetypeLinks(record)
	};
}

export function buildItemHref(fileIdentifier: string): string {
	return `/item?id=${encodeURIComponent(fileIdentifier)}`;
}

export function formatDisplayDate(value: string | null | undefined): string {
	if (!value) {
		return 'N/A';
	}

	const parsedDate = new Date(value);

	if (Number.isNaN(parsedDate.getTime())) {
		return value;
	}

	return parsedDate.toLocaleDateString('en-GB', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function filterAndSortRecords(
	records: CatalogueResultCardRecord[],
	filters: CatalogueViewFilters
): CatalogueResultCardRecord[] {
	const searchTerm = filters.searchTerm.trim().toLowerCase();
	const startTime = toComparableDate(filters.startDate);
	const endTime = toComparableDate(filters.endDate);
	const resourceTypes = new Set(filters.selectedResourceTypes);
	const formats = new Set(filters.selectedFormats);

	const filteredRecords = records.filter((record) => {
		if (searchTerm) {
			const searchableText = `${record.title} ${record.abstract} ${record.resourceType} ${record.formats.join(' ')}`.toLowerCase();

			if (!searchableText.includes(searchTerm)) {
				return false;
			}
		}

		if (resourceTypes.size > 0 && !resourceTypes.has(record.resourceType)) {
			return false;
		}

		if (formats.size > 0 && !record.formats.some((format) => formats.has(format))) {
			return false;
		}

		const publicationTime = toComparableDate(record.publicationDate);

		if (startTime !== null && (publicationTime === null || publicationTime < startTime)) {
			return false;
		}

		if (endTime !== null && (publicationTime === null || publicationTime > endTime)) {
			return false;
		}

		return true;
	});

	return [...filteredRecords].sort((left, right) => {
		const direction = filters.isAscending ? 1 : -1;

		switch (filters.sortBy) {
			case SortByCriteria.Title:
				return direction * left.title.localeCompare(right.title);
			case SortByCriteria.PublicationDate:
				return direction * compareDates(left.publicationDate, right.publicationDate);
			case SortByCriteria.RevisionDate:
				return direction * compareDates(left.revisionDate, right.revisionDate);
			case SortByCriteria.Relevance:
			default:
				return direction * (left.relevanceRank - right.relevanceRank);
		}
	});
}

function buildValueCounts(values: string[]): ValueCount[] {
	const counts = new Map<string, number>();

	for (const value of values) {
		const trimmedValue = value.trim();

		if (!trimmedValue) {
			continue;
		}

		counts.set(trimmedValue, (counts.get(trimmedValue) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([value, count]) => ({ value, count }))
		.sort((left, right) => left.value.localeCompare(right.value));
}

function buildAbstract(record: QueryResponsePayload): string {
	if (record.description?.trim()) {
		return record.description.trim();
	}

	const fragments = [
		record.title?.trim() ? `${record.title.trim()} is available in the catalogue.` : null,
		record.resourceType?.trim() ? `Resource type: ${record.resourceType.trim()}.` : null,
		record.tags?.length ? `Keywords: ${record.tags.slice(0, 3).join(', ')}.` : null,
		record.licences?.length ? `Available under ${record.licences[0]}.` : null
	].filter(Boolean);

	return fragments.join(' ') || 'Detailed metadata for this resource will be available soon.';
}

function buildPlaceholderFormats(record: QueryResponsePayload): string[] {
	if (record.formats?.length) {
		return record.formats
			.map((format) => format?.trim())
			.filter((format): format is string => Boolean(format));
	}

	const baseValue = `${record.fileIdentifier ?? ''}${record.title ?? ''}`;
	const seed = [...baseValue].reduce((total, character) => total + character.charCodeAt(0), 0);
	const primaryFormat = PLACEHOLDER_FORMATS[seed % PLACEHOLDER_FORMATS.length];
	const secondaryFormat = record.boundingBox?.length ? 'GeoJSON' : undefined;

	return [...new Set([primaryFormat, secondaryFormat].filter(isDefined))];
}

function buildArchetypeLinks(record: QueryResponsePayload): CatalogueArchetypeLink[] {
	if (!record.archetypeSummaries?.summaries) {
		return [];
	}

	return Object.entries(record.archetypeSummaries.summaries).flatMap(([group, values]) =>
		values
			.filter(
				(value): value is { archetype?: string | null; url: string } =>
					typeof value.url === 'string' && value.url.length > 0
			)
			.map((value) => ({
				group,
				label: value.archetype?.trim() || 'Open resource',
				url: value.url
			}))
	);
}

function toLegacyBoundingBox(boundingBox?: QueryBoundingBox | null) {
	if (
		boundingBox?.minLongitude === undefined ||
		boundingBox.maxLongitude === undefined ||
		boundingBox.minLatitude === undefined ||
		boundingBox.maxLatitude === undefined
	) {
		return undefined;
	}

	return {
		westBoundLongitude: boundingBox.minLongitude,
		eastBoundLongitude: boundingBox.maxLongitude,
		southBoundLatitude: boundingBox.minLatitude,
		northBoundLatitude: boundingBox.maxLatitude
	};
}

function compareDates(left: string | null, right: string | null) {
	const leftDate = toComparableDate(left);
	const rightDate = toComparableDate(right);

	if (leftDate === rightDate) {
		return 0;
	}

	if (leftDate === null) {
		return -1;
	}

	if (rightDate === null) {
		return 1;
	}

	return leftDate - rightDate;
}

function toComparableDate(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}

function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}

function formatTimespan(start: string | null, end: string | null): string {
	if (!start && !end) {
		return 'Unknown time coverage';
	}

	if (!start) {
		return `Up to ${formatDisplayDate(end)}`;
	}

	if (!end) {
		return `From ${formatDisplayDate(start)}`;
	}

	return `${formatDisplayDate(start)} to ${formatDisplayDate(end)}`;
}
