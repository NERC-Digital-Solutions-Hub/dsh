import {
	rehypeGithubAlerts,
	rehypeInlineTextAdjacentSvgIcons,
	rehypeReferences
} from '@dsh/common';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

declare const sanitizedHtmlBrand: unique symbol;
export type SanitizedHtml = string & { readonly [sanitizedHtmlBrand]: true };

/**
 * Marks SVG markup produced by first-party icon helpers as trusted.
 * Do not use this for API, CMS, configuration, or other externally supplied HTML.
 */
export function trustLocalIconHtml(iconHtml: string): SanitizedHtml {
	return iconHtml as SanitizedHtml;
}

const schema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		'*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'ariaHidden', 'role']
	}
};

export async function renderMarkdownToSanitizedHtml(markdown: string): Promise<SanitizedHtml> {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeGithubAlerts)
		.use(rehypeInlineTextAdjacentSvgIcons)
		.use(rehypeReferences)
		.use(rehypeSanitize, schema)
		.use(rehypeStringify)
		.process(markdown);

	return result.toString() as SanitizedHtml;
}

export async function sanitizeHtmlFragment(html: string): Promise<SanitizedHtml> {
	const result = await unified()
		.use(rehypeParse, { fragment: true })
		.use(rehypeSanitize, schema)
		.use(rehypeStringify)
		.process(html);

	return result.toString() as SanitizedHtml;
}
