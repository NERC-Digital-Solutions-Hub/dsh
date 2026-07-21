import type { MetadataResolvedContent, MetadataTabContentItem } from '$lib/Types/Metadata.types';
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
	arcgisInfo: () => loadRenderer(() => import('./Renderers/ArcgisInfoRenderer.svelte')),
	portalPage: () => loadRenderer(() => import('./Renderers/PortalPageRenderer.svelte')),
	isoMetadata: () => loadRenderer(() => import('./Renderers/IsoMetadataRenderer.svelte')),
	text: () => loadRenderer(() => import('./Renderers/TextRenderer.svelte')),
	disclaimer: () => loadRenderer(() => import('./Renderers/DisclaimerRenderer.svelte')),
	image: () => loadRenderer(() => import('./Renderers/ImageRenderer.svelte')),
	slideshow: () => loadRenderer(() => import('./Renderers/SlideshowRenderer.svelte')),
	xml: () => loadRenderer(() => import('./Renderers/XmlRenderer.svelte')),
	md: () => loadRenderer(() => import('./Renderers/MarkdownRenderer.svelte')),
	docx: () => loadRenderer(() => import('./Renderers/DocxRenderer.svelte')),
	pdf: () => loadRenderer(() => import('./Renderers/PdfRenderer.svelte'))
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
