export type SummaryContentType = 'md' | 'html' | 'xml' | 'text';

export type MarkdownSummaryContent = {
	type: 'md';
	source: string;
};

export type HtmlSummaryContent = {
	type: 'html';
	source: string;
};

export type XmlSummaryContent = {
	type: 'xml';
	source: string;
};

export type TextSummaryContent = {
	type: 'text';
	source: string;
};

export type SummaryContentItem =
	| MarkdownSummaryContent
	| HtmlSummaryContent
	| XmlSummaryContent
	| TextSummaryContent;

export type SummaryResolvedContentByType = {
	md: { type: 'md'; text: string };
	html: { type: 'html'; text: string };
	xml: { type: 'xml'; text: string };
	text: { type: 'text'; text: string };
};

export type SummaryResolvedContent = SummaryResolvedContentByType[SummaryContentType];
