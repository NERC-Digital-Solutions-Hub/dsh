/**
 * Interface for checking the downloaded state of treeview nodes.
 */
export interface INodeDownloadedState {
	/**
	 * Checks if the node with the given ID is downloaded.
	 * @param nodeId The node ID to check if it is downloaded.
	 * @returns True if the node is downloaded, false otherwise.
	 */
	isNodeDownloaded(nodeId: string): boolean;

	/**
	 * Navigates to the download with the given node ID.
	 * @param nodeId The node ID to find the download for and navigate to.
	 */
	goToDownload(nodeId: string): void;
}
