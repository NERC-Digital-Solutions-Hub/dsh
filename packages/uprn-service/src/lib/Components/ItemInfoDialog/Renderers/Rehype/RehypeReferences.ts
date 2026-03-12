import { visit } from 'unist-util-visit';

type ElementNode = {
	type: 'element';
	tagName: string;
	properties?: Record<string, unknown>;
	children?: any[];
};

function getText(node: any): string {
	if (!node) return '';

	if (node.type === 'text') return node.value || '';
	if (Array.isArray(node.children)) return node.children.map(getText).join('');

	return '';
}

function addClass(node: ElementNode, className: string) {
	if (!node.properties) node.properties = {};

	const existing = node.properties.className;

	if (Array.isArray(existing)) {
		if (!existing.includes(className)) {
			node.properties.className = [...existing, className];
		}
	} else if (typeof existing === 'string') {
		node.properties.className = [existing, className];
	} else {
		node.properties.className = [className];
	}
}

function looksLikeReferenceParagraph(node: any) {
	if (!node || node.type !== 'element' || node.tagName !== 'p') return false;

	const text = getText(node).trim();
	return /^\[\d+\]\s+/.test(text);
}

export default function rehypeReferences() {
	return function (tree: any) {
		visit(tree, 'element', (node: ElementNode, index: number | undefined, parent: any) => {
			if (
				!parent ||
				typeof index !== 'number' ||
				!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)
			) {
				return;
			}

			const headingText = getText(node).trim().toLowerCase();

			if (headingText !== 'references') return;

			addClass(node, 'references-heading');

			for (let i = index + 1; i < parent.children.length; i++) {
				const sibling = parent.children[i];

				if (looksLikeReferenceParagraph(sibling)) {
					addClass(sibling, 'references-item');
					continue;
				}

				if (
					sibling?.type === 'element' &&
					['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(sibling.tagName)
				) {
					return;
				}

				if (sibling?.type === 'text' && !getText(sibling).trim()) {
					continue;
				}

				if (sibling?.type === 'element' && sibling.tagName === 'p') {
					return;
				}
			}
		});
	};
}
