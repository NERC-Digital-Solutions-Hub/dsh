import { resolve } from 'node:path';
import { generateStaticContentApi } from '../src/lib/static-generator';

const outDir = getArgValue('--out') ?? 'static/content';

await generateStaticContentApi({
	outDir: resolve(outDir),
	environment: process.env.PUBLIC_DSH_ENVIRONMENT,
	contentBaseUrl: process.env.PUBLIC_DSH_CONTENT_BASE_URL
});

function getArgValue(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	if (index === -1) {
		return undefined;
	}

	return process.argv[index + 1];
}
