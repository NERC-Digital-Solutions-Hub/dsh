// src/routes/proxy/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const passed = url.searchParams.get('url') ?? url.search.slice(1);

	// guard against proxying ourselves
	const target = new URL(passed);
	if (target.origin === url.origin && target.pathname.startsWith('/proxy')) {
		return new Response('Refusing to proxy the proxy (would loop).', { status: 400 });
	}

	const res = await fetch(passed);
	return new Response(res.body, {
		status: res.status,
		headers: {
			'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
