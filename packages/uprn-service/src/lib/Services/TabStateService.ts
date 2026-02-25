import type { ITabStateProvider } from '$lib/Services/ITabStateProvider';

/**
 * Represets a service that provides the current tab state.
 */
export class TabStateService implements ITabStateProvider {
	private currentTabId: string;

	/**
	 * Initializes an instance of TabStateService.
	 * @param initialTabId The initial tab ID.
	 */
	constructor(initialTabId: string) {
		this.currentTabId = initialTabId;
	}

	/**
	 * Sets the current tab ID.
	 * @param tabId The tab ID to set.
	 */
	public setCurrentTab(tabId: string): void {
		this.currentTabId = tabId;
	}

	/** @inheritdoc */
	public getTabState(): string {
		return this.currentTabId;
	}
}
