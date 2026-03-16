import type { TreeviewConfig } from '$lib/Types/Treeview.types';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/Types/Uprn.types';

export type RemoteSiteConfig = {
	environment: string;
};

/**
 * Files exposed by dsh-content manifest for the /apps/uprn-service route.
 */
export type AppsUprnServiceGeneratedCsvConfigFiles = {
	datasets: string;
	domains: string;
	folders: string;
	mdUris: string;
	variables: string;
};

export type AppsUprnServiceGeneratedFiles = {
	csv: {
		config: AppsUprnServiceGeneratedCsvConfigFiles;
	};
	manifest: string;
};

export type AppsUprnServiceManifestFiles = {
	chatbot: string;
	cjBackend: string;
	climatejustRenderers: string;
	config: string;
	config2: string;
	generated: AppsUprnServiceGeneratedFiles;
	infoDescriptions: string;
	introduction: string;
};

export type ManifestPage = {
	route: string;
};

/**
 * Single page entry for /apps/uprn-service within manifest.testing.json.
 */
export type AppsUprnServiceManifestPage = {
	route: '/apps/uprn-service';
	files: AppsUprnServiceManifestFiles;
} & ManifestPage;

/**
 * Represets the site manifest for content served from the dsh-content repository.
 */
export type SiteManifest = {
	version: string;
	environment: string;
	pages: ManifestPage[];
};

export type AppUprnContentConfig = {
	baseUrl: string;
	sitePath: string;
};

export type AppUprnContent = {
	baseUrl: string;
	manifest: AppsUprnServiceManifestPage;
};

export type LocalAppsUprnConfig = {
	content: AppUprnContentConfig;
	uprnDownload: UprnDownloadEndpoints;
	aiUprnChatbot: AiUprnChatbotEndpoints;
	mapConfig: MapConfig;
};

export type AppsUprnConfig = {
	map: MapConfig;
	content: AppUprnContent;
	uprnDownload: UprnDownloadEndpoints;
	aiUprnChatbot: AiUprnChatbotEndpoints;
	treeviewConfig: TreeviewConfig;
};

export type MapConfig = {
	_name?: string;
	title: string;
	portalUrl?: string | null;
	portalItemId: string;
	treeview?: TreeviewConfig;
	tagDefinitions?: TagDefinition[];
	selectableLayers?: { _name: string; id: string; nameField: string; codeField: string }[];
};

export type Proxy = {
	urlPrefix: string;
	proxyUrl: string;
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

/**
 * Configuration for the AI UPRN chatbot, including the initial message and example questions to guide users.
 */
export type ChatbotRemoteConfig = {
	/** The initial message that the chatbot will display when a user starts a conversation */
	initialMessage: string;
	/** A list of example questions that users can ask the chatbot to understand its capabilities */
	exampleQuestions: string[];
};
