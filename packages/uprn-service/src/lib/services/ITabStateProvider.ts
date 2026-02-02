/**
 * Interface that provides the tab state information.
 */
export interface ITabStateProvider {
	/**
	 * Get the current tab state.
	 * @return The current tab state.
	 */
	getTabState(): string;
}
