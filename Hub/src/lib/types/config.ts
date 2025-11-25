import type { TreeviewConfig } from '$lib/types/treeview';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/types/uprn';

export type AppConfig = {
	catalogueConfig: CatalogueConfig;
	appsUprnConfig: AppsUprnConfig;
};

export type ContentConfig = {
	content: {
		organisation: string;
		repo: string;
		relativePath: string;
		research: {
			dir: string;
			main: string;
			articles: {
				dir: string;
				index: string;
			};
		};
	};
};

export type CatalogueConfig = {
	catalogueApiUrl: string;
};

export type AppsUprnConfig = {
	uprnDownloadServiceEndpoints: UprnDownloadEndpoints;
	aiUprnChatbotServiceEndpoints: AiUprnChatbotEndpoints;
	mainSidebarSizes?: SizeConfig[];
	maps: PortalItemConfig[];
};

export type PortalItemConfig = {
	__name?: string;
	title: string;
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	areaTreeview?: TreeviewConfig;
	dataTreeview?: TreeviewConfig;
	selectableLayers?: { layerName: string; nameField: string; codeField: string }[];
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
