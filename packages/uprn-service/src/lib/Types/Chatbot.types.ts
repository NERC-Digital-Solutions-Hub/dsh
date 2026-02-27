import type { EndpointHealthStatus, TabType } from '$lib/Types/Uprn.types';

export type AiChatbotHealthResponse = {
	status: EndpointHealthStatus;
	uptime: number;
};

export interface AiChatbotChatRequest {
	query: string;
	session_id: string;
	sequence_number: number;
	state: AppTabState;
}

export interface AppTabState {
	tab: TabType;
	selections: string[];
}

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
	/** Session identifier (min length 1). */
	session_id: string;

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
  session_id: string;
  sequence_number: number;
  created_at: string;
  message: string;
};