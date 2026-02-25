import type { TreeviewConfig } from '$lib/Types/treeview';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/Types/uprn';

export type AppsUprnConfig = {
	map: PortalItemConfig;
	uprnDownload: UprnDownloadEndpoints;
	aiUprnChatbot: AiUprnChatbotEndpoints;
	mainSidebarSizes?: SizeConfig[];
};

export type PortalItemConfig = {
	_name?: string;
	title: string;
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	customRenderers?: string;
	treeview?: TreeviewConfig;
	tagDefinitions?: TagDefinition[];
	selectableLayers?: { _name: string; id: string; nameField: string; codeField: string }[];
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
};

export type SizeConfig = {
	breakpoint: number;
	originalSize: string;
	minSize: string;
};

/**
 * Definition for a tag that can be associated with treeview nodes.
 */
export type TagDefinition = {
	/** Unique identifier for the tag */
	id: string;

	/** Display label for the tag */
	label: string;

	/** Color associated with the tag for visual representation */
	color: string;
};
