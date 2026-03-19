import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { rehypeGithubAlerts, rehypeInlineTextAdjacentSvgIcons } from '@dsh/common';

export async function renderHomeIntroductionMarkdown(markdown: string): Promise<string> {
	const htmlRaw = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeGithubAlerts)
		.use(rehypeInlineTextAdjacentSvgIcons)
		.use(rehypeStringify)
		.process(markdown);

	return htmlRaw.toString();
}
