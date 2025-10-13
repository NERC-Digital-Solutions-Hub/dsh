import type { LayerNameField } from '$lib/stores/area-selection-store.svelte';
import type { TreeviewConfig } from '$lib/types/treeview';

export type AppConfig = {
	catalogueConfig: CatalogueConfig;
	serviceUprnConfig: ServiceUprnConfig;
	serviceUprn2Config: ServiceUprn2Config;
};

export type CatalogueConfig = {
	catalogueApiUrl: string;
};

export type ServiceUprnConfig = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	catalogueApiUrl: string;
	dataSelectionTreeviewConfig?: TreeviewConfig;
	areaSelectionTreeviewConfig?: TreeviewConfig;
	selectionLayersNameFields?: LayerNameField[];
	fieldsToHide?: string[];
};

export type ServiceUprn2Config = {
	portalUrl?: string | null;
	portalItemId: string;
	proxy?: Proxy | null;
	catalogueApiUrl: string;
	dataSelectionTreeviewConfig?: TreeviewConfig;
	areaSelectionTreeviewConfig?: TreeviewConfig;
	selectionLayersNameFields?: LayerNameField[];
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
};
