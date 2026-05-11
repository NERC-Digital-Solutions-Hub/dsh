import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContentSource } from './dsh-content-source';

test('reads manifest pages and rewrites relative markdown assets', async () => {
	const responses = new Map<string, unknown>([
		[
			'https://example.test/content/manifest.production.json',
			{
				schemaVersion: 1,
				version: '1',
				environment: 'production',
				pages: {
					home: {
						route: '/',
						assets: {
							introduction: { path: 'home/introduction.md', type: 'markdown' },
							settings: { path: 'home/settings.json', type: 'json' }
						}
					}
				}
			}
		],
		[
			'https://example.test/content/pages/home/introduction.md',
			'![Logo](./logo.png)\n[Read more](docs/page.html)'
		],
		['https://example.test/content/pages/home/settings.json', { enableIntroductionPopup: true }]
	]);
	const source = createContentSource({
		baseUrl: 'https://example.test/content/',
		fetch: createJsonFetch(responses)
	});

	const page = await source.getPage('/');
	const markdown = await source.readText(page, 'introduction');
	const settings = await source.readJson<{ enableIntroductionPopup: boolean }>(page, 'settings');

	assert.equal(
		markdown,
		'![Logo](https://example.test/content/pages/home/logo.png)\n[Read more](https://example.test/content/pages/home/docs/page.html)'
	);
	assert.deepEqual(settings, { enableIntroductionPopup: true });
});

function createJsonFetch(responses: Map<string, unknown>): typeof fetch {
	return (async (input: string | URL | Request) => {
		const url = input.toString();
		const value = responses.get(url);
		if (value === undefined) {
			return new Response('not found', { status: 404, statusText: 'Not Found' });
		}

		return new Response(typeof value === 'string' ? value : JSON.stringify(value), { status: 200 });
	}) as typeof fetch;
}
