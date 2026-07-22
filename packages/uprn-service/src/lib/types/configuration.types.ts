import type { TreeviewConfig } from '$lib/types/treeview.types';
import type { CustomRenderers } from '$lib/types/custom-renderers.types';
import type { AiUprnChatbotEndpoints } from '$lib/types/chatbot.types';
import type { UprnDownloadEndpoints } from '$lib/types/download.types';

export type AppUprnContent = {
	settings: GeneralSettings;
	introductionMarkdown: string;
	customRenderers: CustomRenderers;
};

export type LocalAppsUprnConfig = {
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

export type WebMapSourceConfig =
	| {
			/** Display label for this source, used when toggling sources in the UI. */
			name: string;
			kind: 'portal-item';
			itemId: string;
			portalUrl?: string | null;
	  }
	| {
			/** Display label for this source, used when toggling sources in the UI. */
			name: string;
			kind: 'webmap-json-url';
			url: string;
			portalUrl?: string | null;
			credentials?: RequestCredentials;
	  };

export type MapConfig = {
	_name?: string;
	title: string;
	/** Available web map sources. The first entry is the default. */
	sources: WebMapSourceConfig[];
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
