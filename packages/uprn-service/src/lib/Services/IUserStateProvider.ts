import type { UserState } from '$lib/Types/Uprn.types';

/**
 * Interface that provides the user state information. This includes information such as which tab is selected, and which items they've selected.
 */
export interface IUserStateProvider {
	/**
	 * Get the current user state.
	 * @return The current user state.
	 */
	getUserState(): UserState;
}
