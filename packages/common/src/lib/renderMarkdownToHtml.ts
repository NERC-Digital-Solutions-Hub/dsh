import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeReferences from './RehypeReferences';

/**
 * Converts markdown content into HTML using the shared prose pipeline.
 */
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
	if (!markdown) {
		return '';
	}

	const html = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeReferences)
		.use(rehypeStringify)
		.process(markdown);

	return html.toString();
}
