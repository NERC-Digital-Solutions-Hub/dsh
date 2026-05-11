import type { TreeviewConfig } from '$lib/Types/Treeview.types';
import type { CustomRenderers } from '$lib/Types/CustomRenderers.types';
import type { AiUprnChatbotEndpoints, UprnDownloadEndpoints } from '$lib/Types/Uprn.types';

export type AppUprnContentConfig = {
	baseUrl: string;
	sitePath?: string;
};

export type AppUprnContent = {
	settings: GeneralSettings;
	introductionMarkdown: string;
	customRenderers: CustomRenderers;
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
export type ChatbotConfig = {
	/** The initial message that the chatbot will display when a user starts a conversation */
	initialMessage: string;
	/** A list of example questions that users can ask the chatbot to understand its capabilities */
	exampleQuestions: string[];
};

/**
 * General settings for the UPRN service.
 */
export type GeneralSettings = {
	enableIntroductionPopup: boolean;
	chatbot: ChatbotConfig;
};
