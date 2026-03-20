type HastNode = {
	type: string;
	value?: string;
	children?: HastNode[];
	properties?: Record<string, unknown>;
	tagName?: string;
};

export function rehypeInlineTextAdjacentSvgIcons() {
	return (tree: HastNode) => {
		visitTree(tree, undefined);
	};
}

function visitTree(node: HastNode, parent: HastNode | undefined) {
	if (!node.children || node.children.length === 0) {
		return;
	}

	for (let i = 0; i < node.children.length; i += 1) {
		const child = node.children[i];

		if (isSvgImageNode(child)) {
			const replacement = convertSvgImgToMaskedSpan(child, node);
			node.children[i] = replacement;
			continue;
		}

		visitTree(child, node);
	}
}

function isSvgImageNode(node: HastNode): boolean {
	if (node.type !== 'element' || node.tagName !== 'img') {
		return false;
	}

	const src = node.properties?.src;
	return typeof src === 'string' && /\.svg(?:[?#].*)?$/i.test(src);
}

function convertSvgImgToMaskedSpan(imgNode: HastNode, parent: HastNode | undefined): HastNode {
	const imgProps = imgNode.properties ?? {};
	const rawSrc = typeof imgProps.src === 'string' ? imgProps.src : '';
	const alt = typeof imgProps.alt === 'string' ? imgProps.alt.trim() : '';
	const variant = getSvgVariant(rawSrc);
	const maskUrl = stripVariantParam(rawSrc);

	const spanNode: HastNode = {
		type: 'element',
		tagName: 'span',
		properties: {},
		children: []
	};

	addClassName(spanNode, 'svg-icon');

	if (variant) {
		addClassName(spanNode, `svg-icon--${variant}`);
	}

	if (hasSiblingText(parent, imgNode)) {
		addClassName(spanNode, 'inline-svg-icon');
	}

	copySupportedPresentationProps(imgProps, spanNode.properties!);
	setMaskStyle(spanNode.properties!, maskUrl);

	if (alt.length > 0) {
		spanNode.properties!.role = 'img';
		spanNode.properties!['aria-label'] = alt;
	} else {
		spanNode.properties!['aria-hidden'] = 'true';
	}

	return spanNode;
}

function getSvgVariant(src: string): string | null {
	try {
		const url = new URL(src, 'https://example.invalid');
		const variant = url.searchParams.get('variant');
		return sanitizeVariant(variant);
	} catch {
		const match = src.match(/[?&]variant=([a-z0-9_-]+)/i);
		return sanitizeVariant(match?.[1] ?? null);
	}
}

function sanitizeVariant(value: string | null): string | null {
	if (!value) {
		return null;
	}

	return /^[a-z0-9_-]+$/i.test(value) ? value : null;
}

function stripVariantParam(src: string): string {
	try {
		const url = new URL(src, 'https://example.invalid');
		url.searchParams.delete('variant');

		if (isAbsoluteUrl(src)) {
			return url.toString();
		}

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return src
			.replace(/([?&])variant=[^&#]*(&)?/i, (_, prefix: string, trailingAmp: string | undefined) =>
				prefix === '?' && trailingAmp ? '?' : trailingAmp ? prefix : ''
			)
			.replace(/\?$/, '')
			.replace(/&$/, '');
	}
}

function isAbsoluteUrl(value: string): boolean {
	return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//');
}

function copySupportedPresentationProps(
	sourceProps: Record<string, unknown>,
	targetProps: Record<string, unknown>
) {
	copyClassNames(sourceProps, targetProps);

	if (typeof sourceProps.id === 'string' && sourceProps.id.trim()) {
		targetProps.id = sourceProps.id;
	}

	if (typeof sourceProps.title === 'string' && sourceProps.title.trim()) {
		targetProps.title = sourceProps.title;
	}

	if (typeof sourceProps.width === 'string' || typeof sourceProps.width === 'number') {
		targetProps['data-width'] = String(sourceProps.width);
	}

	if (typeof sourceProps.height === 'string' || typeof sourceProps.height === 'number') {
		targetProps['data-height'] = String(sourceProps.height);
	}

	if (typeof sourceProps['aria-describedby'] === 'string') {
		targetProps['aria-describedby'] = sourceProps['aria-describedby'];
	}

	if (typeof sourceProps['aria-labelledby'] === 'string') {
		targetProps['aria-labelledby'] = sourceProps['aria-labelledby'];
	}
}

function setMaskStyle(properties: Record<string, unknown>, svgUrl: string) {
	const safeUrl = cssUrl(svgUrl);
	const existingStyle = typeof properties.style === 'string' ? properties.style : '';

	const maskStyle = [`--svg-icon-url: url(${safeUrl})`].join('; ');

	properties.style = mergeStyleStrings(existingStyle, maskStyle);
}

function cssUrl(value: string): string {
	return `"${String(value).replace(/["\\\n\r\f]/g, '\\$&')}"`;
}

function hasSiblingText(parent: HastNode | undefined, currentNode: HastNode): boolean {
	if (!parent) {
		return false;
	}

	for (const sibling of parent.children ?? []) {
		if (sibling === currentNode) {
			continue;
		}

		if (containsVisibleText(sibling)) {
			return true;
		}
	}

	return false;
}

function containsVisibleText(node: HastNode): boolean {
	if (node.type === 'text') {
		return typeof node.value === 'string' && node.value.trim().length > 0;
	}

	for (const child of node.children ?? []) {
		if (containsVisibleText(child)) {
			return true;
		}
	}

	return false;
}

function addClassName(node: HastNode, classNameToAdd: string) {
	const properties = (node.properties ??= {});
	const className = properties.className;

	if (Array.isArray(className)) {
		if (!className.includes(classNameToAdd)) {
			className.push(classNameToAdd);
		}
		return;
	}

	if (typeof className === 'string' && className.length > 0) {
		const classes = className.split(/\s+/);
		if (!classes.includes(classNameToAdd)) {
			classes.push(classNameToAdd);
		}
		properties.className = classes;
		return;
	}

	properties.className = [classNameToAdd];
}

function copyClassNames(
	sourceProps: Record<string, unknown>,
	targetProps: Record<string, unknown>
) {
	const classes = new Set<string>();

	for (const value of [targetProps.className, sourceProps.className]) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === 'string' && item.trim()) {
					classes.add(item);
				}
			}
			continue;
		}

		if (typeof value === 'string' && value.trim()) {
			for (const item of value.split(/\s+/)) {
				if (item) {
					classes.add(item);
				}
			}
		}
	}

	if (classes.size > 0) {
		targetProps.className = [...classes];
	}
}

function mergeStyleStrings(a: string, b: string): string {
	const left = a.trim().replace(/;+\s*$/, '');
	const right = b.trim().replace(/^;+\s*/, '');

	if (!left) {
		return right;
	}

	if (!right) {
		return left;
	}

	return `${left}; ${right}`;
}
