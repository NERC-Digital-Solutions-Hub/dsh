export default class UseFetchWebMaps {
	#response: __esri.PortalQueryResult | null = $state(null);

	#isLoading = $state(false);

	#error = $state<Error | null>(null);

	async fetchWebMaps(url: string) {
		this.#isLoading = true;
		this.#error = null;

		try {
			const response: Response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch web maps: ${response.status} ${response.statusText}`);
			}

			const data: __esri.PortalQueryResult = await response.json();
			this.#response = data;
		} catch (err) {
			this.#error = err as Error;
		} finally {
			this.#isLoading = false;
		}
	}

	get response() {
		return this.#response;
	}

	get isLoading() {
		return this.#isLoading;
	}

	get error() {
		return this.#error;
	}
}
