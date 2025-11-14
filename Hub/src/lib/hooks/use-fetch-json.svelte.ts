/**
 * The generic useFetchJson hook for fetching JSON data from an API.
 *
 * @template T - The type of data to be fetched.
 * @returns The data, isLoading, error, and load.
 */
export default class UseFetchJson<T> {
	#data: T | null = $state<T | null>(null);
	#isLoading: boolean = $state(false);
	#error: Error | null = $state<Error | null>(null);

	public load = async (url: string) => {
		this.#isLoading = true;
		this.#error = null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(response.statusText);
			}

			this.#data = (await response.json()) as T;
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
