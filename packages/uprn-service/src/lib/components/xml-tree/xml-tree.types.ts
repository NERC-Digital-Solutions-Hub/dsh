export type XmlElementNode = {
	kind: 'element';
	name: string;
	attrs: Record<string, string>;
	children: XmlTreeNode[];
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

export type XmlTreeNode = XmlElementNode | XmlTextNode | XmlCommentNode | XmlCdataNode;
