export type TabsPayload = {
	tabs: MetadataTab[];
};

export type MetadataTab = {
	title: string;
	content: MetadataTabContentItem[];
};

export type MetadataTabContentItem =
	| TextContent
	| ImageContent
	| SlideshowContent
	| XmlContent
	| DocxContent
	| PdfContent;

export type TextContent = {
	type: 'text';
	link: string;
};

export type ImageContent = {
	type: 'image';
	link: string;
};

export type SlideshowContent = {
	type: 'slideshow';
	links: string[];
};

export type XmlContent = {
	type: 'xml';
	link: string;
};

export type DocxContent = {
	type: 'docx';
	link: string;
};

export type PdfContent = {
	type: 'pdf';
	link: string;
};
