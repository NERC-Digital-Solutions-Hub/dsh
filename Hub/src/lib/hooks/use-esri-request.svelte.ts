import esriRequest from '@arcgis/core/request.js';

/**
 * The Esri request hook for fetching JSON data from the ArcGIS portal API.
 *
 * @returns The data, isLoading, and error.
 */
export default class UseEsriRequest {
	#data: any | null = $state<any | null>(null);
	#isLoading: boolean = $state(false);
	#error: Error | null = $state<Error | null>(null);

	public load = async (url: string, options?: __esri.RequestOptions) => {
		this.#isLoading = true;
		this.#error = null;

		try {
			const response = await esriRequest(url, {...options, responseType: 'json' });
			this.#data = response.data;
		} catch (e) {
			this.#error = e as Error;
		} finally {
			this.#isLoading = false;
		}
	};

	public get data() {
		return this.#data;
	}

	public get isLoading() {
		return this.#isLoading;
	}

	public get error() {
		return this.#error;
	}
}
