export type XmlElementNode = {
	kind: 'element';
	name: string;
	attrs: Record<string, string>;
	children: XmlTreeviewNode[];
};

export type XmlTextNode = {
	kind: 'text';
	text: string;
};

export type XmlCommentNode = {
	kind: 'comment';
	text: string;
};

export type XmlCdataNode = {
	kind: 'cdata';
	text: string;
};

export type XmlTreeviewNode = XmlElementNode | XmlTextNode | XmlCommentNode | XmlCdataNode;
