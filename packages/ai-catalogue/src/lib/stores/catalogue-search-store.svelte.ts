import type {
	MetadataCommonQueryResponse,
	MetadataSearchCriteriaRequest,
	ValueCount
} from '$lib/types/metadata';

export enum SortByCriteria {
	Relevance = '0',
	Title = '1',
	PublicationDate = '2',
	RevisionDate = '3'
}

/**
 * Store for managing the catalogue search state.
 */
export class CatalogueSearchStore {
	/**
	 * Indicates if the service metadata (resource types, formats) has been loaded successfully.
	 * Undefined means not yet attempted, true means loaded successfully, false means failed to load.
	 */
	public isServiceLoaded: boolean | undefined = $state(undefined);
	public isLoading = $state(false);
	public isLoadingMore = $state(false);
	public hasMore = $state(true);

	#results: MetadataCommonQueryResponse | undefined = $state();
	#criteria: MetadataSearchCriteriaRequest = $state({});
	#endpoint: string;
	#currentPage = $state(0);
	#pageSize = 20;

	#resourceTypes: ValueCount[] = [];

	#formats: ValueCount[] = [];

	constructor(endpoint: string) {
		if (!endpoint) {
			throw new Error('Endpoint URL is required to initialize CatalogueSearchStore');
		}

		this.#endpoint = endpoint;
		this.#loadService();
	}

	#loadService = async () => {
		try {
			await this.#fetchResourceTypes();
			await this.#fetchFormats();
			this.isServiceLoaded = true;
		} catch (error) {
			console.error('Error loading service:', error);
			this.isServiceLoaded = false;
		}
	};

	#fetchResourceTypes = async () => {
		try {
			const response = await fetch(this.#endpoint + '/metadata/resource-types-count', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`Error fetching resource types: ${response.statusText}`);
			}

			const data: ValueCount[] = await response.json();
			this.#resourceTypes = data;
			console.log('Fetched resource types:', data);
		} catch (error) {
			console.error('Error fetching resource types:', error);
			this.#resourceTypes = [];
			throw error;
		}
	};

	#fetchFormats = async () => {
		try {
			const response = await fetch(this.#endpoint + '/metadata/formats-count', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (!response.ok) {
				throw new Error(`Error fetching formats: ${response.statusText}`);
			}
			const data: ValueCount[] = await response.json();
			this.#formats = data;
			console.log('Fetched formats:', data);
		} catch (error) {
			console.error('Error fetching formats:', error);
			this.#formats = [];
			throw error;
		}
	};

	getResourceTypes = (): ValueCount[] => {
		return this.#resourceTypes;
	};

	getFormats = (): ValueCount[] => {
		return this.#formats;
	};

	getResults = () => {
		return this.#results || { totalCount: 0, returnedCount: 0, records: [] };
	};

	getSearchTerm = (): string => {
		return this.#criteria.searchTerm || '';
	};

	setSearchTerm = (term: string) => {
		this.#criteria.searchTerm = term;
	};

	getDateRange = () => {
		return this.#criteria.publicationDateRange || { start: null, end: null };
	};

	setDateRange = (start: string | null, end: string | null) => {
		this.#criteria.publicationDateRange = { start, end };
	};

	clearDateRange = () => {
		this.#criteria.publicationDateRange = undefined;
	};

	getSortBy = (): SortByCriteria => {
		return (this.#criteria.sortByCriteria as SortByCriteria) || SortByCriteria.Relevance;
	};

	setSortBy = (sortBy: SortByCriteria) => {
		this.#criteria.sortByCriteria = sortBy;
	};

	getIsAscending = (): boolean => {
		return this.#criteria.isAscending ?? true; // Default to ascending
	};

	setIsAscending = (isAscending: boolean) => {
		this.#criteria.isAscending = isAscending;
	};

	toggleSortOrder = () => {
		this.#criteria.isAscending = !this.getIsAscending();
	};

	getSelectedResourceTypes = (): string[] => {
		// TODO: This should support multiple selections in the future, currently the API only supports one
		return this.#criteria.resourceType ? [this.#criteria.resourceType] : [];
	};

	setSelectedResourceTypes = (resourceTypes: string[]) => {
		// TODO: This should support multiple selections in the future, currently the API only supports one
		this.#criteria.resourceType = resourceTypes.length > 0 ? resourceTypes[0] : undefined;
	};

	getSelectedFormats = (): string[] => {
		return this.#criteria.formats || [];
	};

	setSelectedFormats = (formats: string[]) => {
		this.#criteria.formats = formats.length > 0 ? formats : undefined;
	};

	submit = async () => {
		if (!this.isServiceLoaded) {
			console.warn('Service is not loaded. Cannot submit search.');
			return;
		}

		console.log('Submitting search with criteria:', this.#criteria);
		this.#currentPage = 1;
		this.hasMore = true;
		this.#criteria.paginationOptions = { pageNumber: this.#currentPage, pageSize: this.#pageSize };

		try {
			this.isLoading = true;
			const response = await fetch(this.#endpoint + '/metadata/common', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(this.#criteria)
			});

			if (!response.ok) {
				throw new Error(`Error fetching search results: ${response.statusText}`);
			}

			const data: MetadataCommonQueryResponse = await response.json();
			this.#results = data;
			this.isLoading = false;

			// Check if we have fewer results than page size, meaning no more results
			if (data.records.length < this.#pageSize) {
				this.hasMore = false;
			}

			console.log('Search results:', data);
		} catch (error) {
			console.error('Error submitting search:', error);
			this.isLoading = false;
			this.hasMore = false;
			this.#results = undefined;
		}
	};

	loadMore = async () => {
		if (this.isLoadingMore || !this.hasMore || this.isLoading) {
			return;
		}

		console.log('Loading more results...');
		this.#currentPage += 1;
		this.#criteria.paginationOptions = { pageNumber: this.#currentPage, pageSize: this.#pageSize };

		try {
			this.isLoadingMore = true;
			const response = await fetch(this.#endpoint + '/metadata/common', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(this.#criteria)
			});

			if (!response.ok) {
				throw new Error(`Error fetching more results: ${response.statusText}`);
			}

			const data: MetadataCommonQueryResponse = await response.json();

			// Append new results to existing ones
			this.#results = {
				totalCount: data.totalCount,
				returnedCount: (this.#results?.returnedCount || 0) + data.returnedCount,
				records: [...(this.#results?.records || []), ...data.records]
			};

			this.isLoadingMore = false;

			// Check if we have fewer results than page size, meaning no more results
			if (data.records.length < this.#pageSize) {
				this.hasMore = false;
			}

			console.log('Loaded more results:', data.records.length);
		} catch (error) {
			console.error('Error loading more results:', error);
			this.isLoadingMore = false;
			this.hasMore = false;
		}
	};
}
