import { renderMarkdownToSanitizedHtml, sanitizeHtmlFragment } from '$lib/Utilities/richText';
import { describe, expect, it } from 'vitest';

describe('rich-text sanitization', () => {
	it('removes scripts, event handlers, and unsafe links from HTML fragments', async () => {
		const html = await sanitizeHtmlFragment(
			'<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>'
		);
		expect(html).toContain('<p>Safe</p>');
		expect(html).not.toContain('onclick');
		expect(html).not.toContain('<script');
		expect(html).not.toContain('javascript:');
	});

	it('sanitizes HTML embedded in Markdown', async () => {
		const html = await renderMarkdownToSanitizedHtml('Hello <img src="x" onerror="alert(1)">');
		expect(html).toContain('Hello');
		expect(html).not.toContain('onerror');
	});
});
