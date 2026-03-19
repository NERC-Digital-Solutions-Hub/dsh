type HastNode = {
	type: string;
	value?: string;
	children?: HastNode[];
	properties?: Record<string, unknown>;
	tagName?: string;
};

type AlertKind = 'note' | 'tip' | 'important' | 'warning' | 'caution';

type LucideNode = [string, Record<string, string>];

const ALERT_META: Record<AlertKind, { title: string; lucideName: string }> = {
	note: { title: 'Note', lucideName: 'info' },
	tip: { title: 'Tip', lucideName: 'lightbulb' },
	important: { title: 'Important', lucideName: 'badge-alert' },
	warning: { title: 'Warning', lucideName: 'triangle-alert' },
	caution: { title: 'Caution', lucideName: 'octagon-alert' }
};

// Icon nodes mirror Lucide icon geometry for consistent visual language.
const LUCIDE_ICON_NODES: Record<string, LucideNode[]> = {
	info: [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['path', { d: 'M12 16v-4' }],
		['path', { d: 'M12 8h.01' }]
	],
	lightbulb: [
		[
			'path',
			{
				d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'
			}
		],
		['path', { d: 'M9 18h6' }],
		['path', { d: 'M10 22h4' }]
	],
	'badge-alert': [
		[
			'path',
			{
				d: 'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z'
			}
		],
		['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
		['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }]
	],
	'triangle-alert': [
		[
			'path',
			{
				d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
			}
		],
		['path', { d: 'M12 9v4' }],
		['path', { d: 'M12 17h.01' }]
	],
	'octagon-alert': [
		['path', { d: 'M12 16h.01' }],
		['path', { d: 'M12 8v4' }],
		[
			'path',
			{
				d: 'M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z'
			}
		]
	]
};

export function rehypeGithubAlerts() {
	return (tree: HastNode) => {
		visitTree(tree);
	};
}

function visitTree(node: HastNode) {
	if (node.type === 'element' && node.tagName === 'blockquote') {
		transformBlockquoteAlert(node);
	}

	for (const child of node.children ?? []) {
		visitTree(child);
	}
}

function transformBlockquoteAlert(blockquote: HastNode) {
	const firstParagraph = blockquote.children?.find(
		(child) => child.type === 'element' && child.tagName === 'p'
	);
	if (!firstParagraph) {
		return;
	}

	const firstTextNode = findFirstTextNode(firstParagraph);
	if (!firstTextNode?.value) {
		return;
	}

	const match = firstTextNode.value.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
	if (!match) {
		return;
	}

	const alertKind = match[1].toLowerCase() as AlertKind;
	firstTextNode.value = firstTextNode.value.replace(match[0], '');

	addClassName(blockquote, 'md-alert');
	addClassName(blockquote, `md-alert-${alertKind}`);

	const titleNode = createAlertTitleNode(alertKind);
	blockquote.children = [titleNode, ...(blockquote.children ?? [])];

	if (firstTextNode.value.trim().length === 0) {
		removeEmptyFirstParagraph(blockquote);
	}
}

function createAlertTitleNode(kind: AlertKind): HastNode {
	const { title, lucideName } = ALERT_META[kind];
	return {
		type: 'element',
		tagName: 'p',
		properties: {
			className: ['md-alert-title']
		},
		children: [createLucideIconNode(lucideName), { type: 'text', value: ` ${title}` }]
	};
}

function createLucideIconNode(lucideName: string): HastNode {
	const iconNodes = LUCIDE_ICON_NODES[lucideName] ?? [];

	return {
		type: 'element',
		tagName: 'svg',
		properties: {
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			className: ['md-alert-icon', 'md-alert-icon-svg', `lucide-${lucideName}`],
			'aria-hidden': 'true'
		},
		children: iconNodes.map(([tagName, attributes]) => ({
			type: 'element',
			tagName,
			properties: attributes,
			children: []
		}))
	};
}

function findFirstTextNode(node: HastNode): HastNode | undefined {
	if (node.type === 'text' && typeof node.value === 'string') {
		return node;
	}

	for (const child of node.children ?? []) {
		const textNode = findFirstTextNode(child);
		if (textNode) {
			return textNode;
		}
	}

	return undefined;
}

function removeEmptyFirstParagraph(blockquote: HastNode) {
	const children = blockquote.children ?? [];
	const firstParagraphIndex = children.findIndex(
		(child) => child.type === 'element' && child.tagName === 'p' && isParagraphEmpty(child)
	);
	if (firstParagraphIndex === -1) {
		return;
	}

	children.splice(firstParagraphIndex, 1);
	blockquote.children = children;
}

function isParagraphEmpty(node: HastNode): boolean {
	if (node.type === 'text') {
		return !node.value || node.value.trim().length === 0;
	}

	for (const child of node.children ?? []) {
		if (!isParagraphEmpty(child)) {
			return false;
		}
	}

	return true;
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
