import type { UserState } from '$lib/Types/uprn';

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
