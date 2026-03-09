import type { Component } from 'svelte';

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

export const metadataRenderers: Record<string, Component> = {
	arcgisInfo: ArcgisInfoRenderer,
	xmlKeyInfo: XmlKeyInfoRenderer,
	text: TextRenderer,
	disclaimer: DisclaimerRenderer,
	image: ImageRenderer,
	slideshow: SlideshowRenderer,
	xml: XmlRenderer,
	md: MarkdownRenderer,
	docx: DocxRenderer,
	pdf: PdfRenderer
};
