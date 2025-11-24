import type { AreaSelectionFieldInfo } from '$lib/stores/apps/uprn/area-selection-store.svelte';
import type { TreeviewConfig } from '$lib/types/treeview';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/types/uprn';

export type AppConfig = {
	catalogueConfig: CatalogueConfig;
	serviceUprnConfig: ServiceUprnConfig;
	serviceUprn2Config: ServiceUprn2Config;
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

export type ServiceUprnConfig = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	dataSelectionTreeviewConfig?: TreeviewConfig;
	areaSelectionTreeviewConfig?: TreeviewConfig;
	selectionLayersNameFields?: AreaSelectionFieldInfo[];
	fieldsToHide?: string[];
};

export type ServiceUprn2Config = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	uprnDownloadServiceEndpoints: UprnDownloadEndpoints;
	aiUprnChatbotServiceEndpoints: AiUprnChatbotEndpoints;
	mainSidebarSizes?: SizeConfig[];
	dataSelectionTreeviewConfig?: TreeviewConfig;
	areaSelectionTreeviewConfig?: TreeviewConfig;
	selectionLayersNameFields?: AreaSelectionFieldInfo[];
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
