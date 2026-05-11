import { asset } from '$app/paths';
import { env } from '$env/dynamic/public';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	fetchHubIntroduction as fetchHubIntroductionFromSource,
	fetchHubSettings as fetchHubSettingsFromSource,
	fetchUprnCustomRenderers as fetchUprnCustomRenderersFromSource,
	fetchUprnIntroduction as fetchUprnIntroductionFromSource,
	fetchUprnSettings as fetchUprnSettingsFromSource,
	fetchUprnTreeviewLayersPayload as fetchUprnTreeviewLayersPayloadFromSource,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from './dsh-content-source';
import type {
	HubSettings,
	TreeviewNodeConfig,
	UprnSettings,
	UprnTreeviewLayersPayload
} from './content-types';

export function getContentEnvironment(): string {
	return resolveContentEnvironment(env.PUBLIC_DSH_ENVIRONMENT);
}

export function getContentApiBaseUrl(): string {
	const configuredBaseUrl = env.PUBLIC_DSH_CONTENT_API_BASE_URL?.trim();
	const baseUrl = configuredBaseUrl || asset('/content');
	return baseUrl.replace(/\/+$/, '');
}

export async function getHubIntroduction(): Promise<string> {
	return await fetchHubIntroductionFromSource(getSourceFallbackOptions());
}

export async function getHubSettings(): Promise<HubSettings> {
	return await fetchHubSettingsFromSource(getSourceFallbackOptions());
}

export async function getUprnIntroduction(): Promise<string> {
	return await fetchUprnIntroductionFromSource(getSourceFallbackOptions());
}

export async function getUprnSettings(): Promise<UprnSettings> {
	return await fetchUprnSettingsFromSource(getSourceFallbackOptions());
}

export async function getUprnCustomRenderers<T = unknown>(): Promise<T> {
	return await fetchUprnCustomRenderersFromSource<T>(getSourceFallbackOptions());
}

export async function getUprnTreeviewLayerPayload(): Promise<UprnTreeviewLayersPayload> {
	return await fetchUprnTreeviewLayersPayloadFromSource(getSourceFallbackOptions());
}

export async function getUprnTreeviewLayers(): Promise<TreeviewNodeConfig[]> {
	const payload = await getUprnTreeviewLayerPayload();
	return payload.layers;
}

function getSourceFallbackOptions() {
	return {
		environment: getContentEnvironment(),
		contentBaseUrl: resolveDshContentBaseUrl(
			env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
		)
	};
}
