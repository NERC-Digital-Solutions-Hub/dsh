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
	if (isInlineTextAdjacentSvg(node, parent)) {
		addClassName(node, 'inline-svg-icon');
	}

	for (const child of node.children ?? []) {
		visitTree(child, node);
	}
}

function isInlineTextAdjacentSvg(node: HastNode, parent: HastNode | undefined): boolean {
	if (!parent || node.type !== 'element' || node.tagName !== 'img') {
		return false;
	}

	const src = node.properties?.src;
	if (typeof src !== 'string' || !/\.svg(?:[?#].*)?$/i.test(src)) {
		return false;
	}

	return hasSiblingText(parent, node);
}

function hasSiblingText(parent: HastNode, currentNode: HastNode): boolean {
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
