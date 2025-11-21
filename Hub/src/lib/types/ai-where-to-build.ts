import type { LayerAnalysisSettings } from '$lib/models/apps/ai-where-to-build/layer-analysis-settings';

/**
 * Configuration for the AI Where To Build service.
 */
export type AiWhereToBuildConfig = {
	/**
	 * Layer analysis settings for the service.
	 */
	analysisSettings: LayerAnalysisSettings[];
};
