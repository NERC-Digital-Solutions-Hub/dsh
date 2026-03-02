<script lang="ts">
	import XmlNode from './XmlTreeviewNode.svelte';
	import type { XmlTreeviewNode } from './XmlTreeview.types';

	type Props = {
		xmlText: string | null | undefined;
		expandAll?: boolean;
	};

	const ELEMENT_NODE = 1;
	const TEXT_NODE = 3;
	const CDATA_SECTION_NODE = 4;
	const COMMENT_NODE = 8;

	let { xmlText, expandAll }: Props = $props();

	let error = $state('');
	let root = $state<XmlTreeviewNode | null>(null);

	function parseXml(source: string): Document {
		return new DOMParser().parseFromString(source, 'application/xml');
	}

	function hasParserError(doc: Document): boolean {
		return doc.getElementsByTagName('parsererror').length > 0;
	}

	function decodeHtmlEntities(value: string): string {
		const textarea = document.createElement('textarea');
		textarea.innerHTML = value;
		return textarea.value;
	}

	function nodeToTree(node: Node): XmlTreeviewNode | null {
		if (node.nodeType === ELEMENT_NODE) {
			const element = node as Element;
			const attrs: Record<string, string> = {};
			for (const attr of element.attributes) {
				attrs[attr.name] = attr.value;
			}

			const children: XmlTreeviewNode[] = [];
			for (const child of element.childNodes) {
				const mappedNode = nodeToTree(child);
				if (mappedNode) {
					children.push(mappedNode);
				}
			}

			return {
				kind: 'element',
				name: element.tagName,
				attrs,
				children
			};
		}

		if (node.nodeType === TEXT_NODE) {
			const text = node.nodeValue ?? '';
			if (!text.trim()) {
				return null;
			}

			return { kind: 'text', text: text.trim() };
		}

		if (node.nodeType === COMMENT_NODE) {
			return { kind: 'comment', text: node.nodeValue ?? '' };
		}

		if (node.nodeType === CDATA_SECTION_NODE) {
			return { kind: 'cdata', text: node.nodeValue ?? '' };
		}

		return null;
	}

	$effect(() => {
		error = '';
		root = null;

		const rawSource = xmlText?.trim();
		if (!rawSource) {
			return;
		}

		try {
			const source = rawSource.replace(/^\uFEFF/, '');
			const parseCandidates = [source];

			if (source.includes('&lt;') && source.includes('&gt;')) {
				const decoded = decodeHtmlEntities(source).trim();
				if (decoded && decoded !== source) {
					parseCandidates.push(decoded);
				}
			}

			let parsedDoc: Document | null = null;
			for (const candidate of parseCandidates) {
				const doc = parseXml(candidate);
				if (!hasParserError(doc)) {
					parsedDoc = doc;
					break;
				}
			}

			if (!parsedDoc) {
				throw new Error('Invalid XML (parsererror)');
			}

			if (!parsedDoc.documentElement) {
				throw new Error('No XML root element found');
			}

			root = nodeToTree(parsedDoc.documentElement);
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	});
</script>

{#if error}
	<p class="err">Error: {error}</p>
{:else if root}
	<div class="xml-tree">
		<XmlNode node={root} depth={0} {expandAll} />
	</div>
{:else}
	<p>No content.</p>
{/if}

<style>
	.err {
		color: #c00;
	}
	.xml-tree {
		width: 100%;
		min-width: 0;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		font-size: 13px;
	}
</style>
