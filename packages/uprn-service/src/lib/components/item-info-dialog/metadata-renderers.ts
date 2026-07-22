import type { MetadataResolvedContent, MetadataTabContentItem } from '$lib/types/metadata.types';
import type { Component } from 'svelte';

export type MetadataRendererComponent = Component<{
	content: MetadataResolvedContent;
	index?: number;
	layer?: __esri.Layer | __esri.Sublayer | null;
}>;

type RendererLoader = () => Promise<{ default: MetadataRendererComponent }>;

async function loadRenderer<TProps extends Record<string, unknown>>(
	loader: () => Promise<{ default: Component<TProps> }>
): Promise<{ default: MetadataRendererComponent }> {
	const module = await loader();
	return { default: module.default as unknown as MetadataRendererComponent };
}

const rendererLoaders: Record<MetadataTabContentItem['type'], RendererLoader> = {
	arcgisInfo: () => loadRenderer(() => import('./renderers/arcgis-info-renderer.svelte')),
	portalPage: () => loadRenderer(() => import('./renderers/portal-page-renderer.svelte')),
	isoMetadata: () => loadRenderer(() => import('./renderers/iso-metadata-renderer.svelte')),
	text: () => loadRenderer(() => import('./renderers/text-renderer.svelte')),
	disclaimer: () => loadRenderer(() => import('./renderers/disclaimer-renderer.svelte')),
	image: () => loadRenderer(() => import('./renderers/image-renderer.svelte')),
	slideshow: () => loadRenderer(() => import('./renderers/slideshow-renderer.svelte')),
	xml: () => loadRenderer(() => import('./renderers/xml-renderer.svelte')),
	md: () => loadRenderer(() => import('./renderers/markdown-renderer.svelte')),
	docx: () => loadRenderer(() => import('./renderers/docx-renderer.svelte')),
	pdf: () => loadRenderer(() => import('./renderers/pdf-renderer.svelte'))
};

const rendererCache = new Map<MetadataTabContentItem['type'], MetadataRendererComponent>();

export async function loadMetadataRenderer(
	type: MetadataTabContentItem['type']
): Promise<MetadataRendererComponent> {
	const cached = rendererCache.get(type);
	if (cached) return cached;
	const renderer = (await rendererLoaders[type]()).default;
	rendererCache.set(type, renderer);
	return renderer;
}
