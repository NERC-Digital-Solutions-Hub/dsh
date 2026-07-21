import type { TabType } from './App.types';

export type AiUprnChatbotEndpoints = {
	__name?: string;
	baseUrl: string;
	healthRoute: string;
	chatRoute: string;
	chatStreamRoute: string;
	feedbackRoute: string;
};

export type EndpointHealthStatus = 'ok';

export type AiChatbotHealthResponse = {
	status: EndpointHealthStatus;
	uptime: number;
};

export interface AiChatbotChatRequest {
	query: string;
	conversation_id: string;
	sequence_number: number;
	state: AppTabState;
}

export interface AiChatbotChatResponse {
	answer: string;
	references: string[];
}

export type AppTabState = {
	tab: TabType;
	selections: AppStateSelections;
};

export type AppStateSelections = {
	area: string[];
	data: string[];
};

/**
 * Types of user feedback.
 */
export enum AiChatbotFeedbackType {
	Complaint = 'complaint'
}

/**
 * Request model for submitting feedback.
 */
export type AiChatbotFeedbackRequest = {
	/** conversation identifier */
	conversation_id: string;

	/** Sequence number to provide feedback for (integer >= 1). */
	sequence_number: number;

	/** Feedback text from user. */
	feedback_text: string;

	/**
	 * Type of feedback.
	 * Default: "complaint"
	 */
	feedback_type?: AiChatbotFeedbackType;
};

export type AiChatbotFeedbackResponse = {
	id: number;
	conversation_id: string;
	sequence_number: number;
	created_at: string;
	message: string;
};
