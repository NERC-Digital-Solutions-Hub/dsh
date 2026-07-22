import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createTypeScriptModule,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import { generateUprnAppConfig } from '../src/lib/content-build/generate-uprn-app-config';
import type { LocalAppsUprnConfig } from '../src/lib/types/configuration.types';

const projectRoot = resolve(import.meta.dirname, '..');
const environment = resolveContentEnvironment(process.env.PUBLIC_DSH_ENVIRONMENT);
const contentBaseUrl = resolveDshContentBaseUrl(
	process.env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
);
const outDir = resolve(projectRoot, 'src/generated/content');

const localConfig = await readJsonFile<LocalAppsUprnConfig>(
	resolve(projectRoot, 'static/config/apps/uprn/config.json')
);
const uprnAppConfig = await generateUprnAppConfig({ localConfig, environment, contentBaseUrl });

await writeModule(
	'uprn.ts',
	createTypeScriptModule({
		imports: ["import type { AppsUprnConfig } from '../../lib/types/configuration.types';"],
		exports: [{ name: 'uprnAppConfig', type: 'AppsUprnConfig', value: uprnAppConfig }]
	})
);

console.log(`[uprn/content] Generated build-time content module for "${environment}" in ${outDir}`);

async function writeModule(fileName: string, content: string): Promise<void> {
	const filePath = resolve(outDir, fileName);
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, content, 'utf8');
}

async function readJsonFile<T>(filePath: string): Promise<T> {
	return JSON.parse(await readFile(filePath, 'utf8')) as T;
}
