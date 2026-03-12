export type TabsPayload = {
	tabGroups: TabGroup[];
};

export type TabGroup = {
	title: string;
	tabs: MetadataTab[];
};

export type MetadataTab = {
	title: string;
	content: MetadataTabContentItem[];
};

export type MetadataTabContentItem =
	| TextContent
	| DisclaimerContent
	| ArcGISInformationContent
	| PortalPageContent
	| IsoMetadataContent
	| ImageContent
	| SlideshowContent
	| XmlContent
	| MarkdownContent
	| DocxContent
	| PdfContent;

export type TextContent = {
	type: 'text';
	value: string;
};

export type DisclaimerContent = {
	type: 'disclaimer';
	value: string;
};

export type ArcGISInformationContent = {
	type: 'arcgisInfo';
};

export type PortalPageContent = {
	type: 'portalPage';
	source: string;
};

export type IsoMetadataContent = {
	type: 'isoMetadata';
	source: string;
};

export type ImageContent = {
	type: 'image';
	source: string;
};

export type SlideshowContent = {
	type: 'slideshow';
	source: string[];
};

export type XmlContent = {
	type: 'xml';
	source: string;
};

export type MarkdownContent = {
	type: 'md';
	source: string;
};

export type DocxContent = {
	type: 'docx';
	name?: string;
	description?: string;
	source: string;
};

export type PdfContent = {
	type: 'pdf';
	name?: string;
	description?: string;
	source: string;
};
