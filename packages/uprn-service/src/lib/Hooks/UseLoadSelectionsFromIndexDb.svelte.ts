import { getSelection, type DbUprnSelection } from '$lib/db';

/**
 * Hook used to load previous selections from indexedDb.
 * @param portalItemId The portal item ID for which to load selections.
 * @returns The loading, error, content states as well as a fetch method.
 */
export function useLoadSelectionsFromIndexDb(portalItemId: string) {
	let content = $state<DbUprnSelection | null>(null);
	let error = $state<unknown>(null);
	let isLoading = $state(false);

	async function fetchAsync() {
		isLoading = true;
		error = null;

		try {
			content = await getSelection(portalItemId);
		} catch (err) {
			error = err;
			content = null;
		} finally {
			isLoading = false;
		}
	}

	return {
		get content() {
			return content;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		fetch: fetchAsync
	};
}
