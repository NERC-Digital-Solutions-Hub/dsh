import type { Component } from 'svelte';
import type { MetadataResolvedContent } from '$lib/Hooks/UseFetchMetadataContent.svelte';
import type { MetadataTabContentItem } from '$lib/Types/Metadata.types';

import ArcgisInfoRenderer from './Renderers/ArcgisInfoRenderer.svelte';
import DisclaimerRenderer from './Renderers/DisclaimerRenderer.svelte';
import DocxRenderer from './Renderers/DocxRenderer.svelte';
import ImageRenderer from './Renderers/ImageRenderer.svelte';
import PdfRenderer from './Renderers/PdfRenderer.svelte';
import SlideshowRenderer from './Renderers/SlideshowRenderer.svelte';
import TextRenderer from './Renderers/TextRenderer.svelte';
import XmlRenderer from './Renderers/XmlRenderer.svelte';
import XmlKeyInfoRenderer from '$lib/Components/ItemInfoDialog/Renderers/XmlKeyInfoRenderer.svelte';
import MarkdownRenderer from '$lib/Components/ItemInfoDialog/Renderers/MarkdownRenderer.svelte';

type MetadataContentType = MetadataTabContentItem['type'];

type MetadataRendererComponent = Component<{
	content: MetadataResolvedContent;
	index?: number;
	layer?: __esri.Layer | __esri.Sublayer | null;
}>;

export const metadataRenderers: Record<MetadataContentType, MetadataRendererComponent> = {
	arcgisInfo: ArcgisInfoRenderer as MetadataRendererComponent,
	xmlKeyInfo: XmlKeyInfoRenderer as MetadataRendererComponent,
	text: TextRenderer as MetadataRendererComponent,
	disclaimer: DisclaimerRenderer as MetadataRendererComponent,
	image: ImageRenderer as MetadataRendererComponent,
	slideshow: SlideshowRenderer as MetadataRendererComponent,
	xml: XmlRenderer as MetadataRendererComponent,
	md: MarkdownRenderer as MetadataRendererComponent,
	docx: DocxRenderer as MetadataRendererComponent,
	pdf: PdfRenderer as MetadataRendererComponent
};
