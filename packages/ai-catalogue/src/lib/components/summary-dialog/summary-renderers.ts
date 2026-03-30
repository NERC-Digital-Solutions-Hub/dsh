import type { Component } from 'svelte';
import type { SummaryContentType, SummaryResolvedContent } from '$lib/types/summary.types';
import MarkdownRenderer from './renderers/markdown-renderer.svelte';
import HtmlRenderer from './renderers/html-renderer.svelte';
import RawTextRenderer from './renderers/raw-text-renderer.svelte';

type SummaryRendererComponent = Component<{
	content: SummaryResolvedContent;
}>;

export const summaryRenderers: Partial<Record<SummaryContentType, SummaryRendererComponent>> = {
	md: MarkdownRenderer as SummaryRendererComponent,
	html: HtmlRenderer as SummaryRendererComponent,
	xml: RawTextRenderer as SummaryRendererComponent,
	text: RawTextRenderer as SummaryRendererComponent
};
