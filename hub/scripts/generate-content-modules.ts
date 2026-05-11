import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createContentSource,
	createTypeScriptModule,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import { generateUprnAppConfig } from '@dsh/uprn-service/content-build';
import type { LocalAppsUprnConfig } from '@dsh/uprn-service';
import type { HomeContent } from '../src/lib/types/content.types';

const projectRoot = resolve(import.meta.dirname, '..');
const outDir = resolve(projectRoot, 'src/lib/generated/content');
const environment = resolveContentEnvironment(process.env.PUBLIC_DSH_ENVIRONMENT);
const contentBaseUrl = resolveDshContentBaseUrl(
	process.env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
);

await Promise.all([generateHomeContent(), generateUprnContent()]);

console.log(`[hub/content] Generated build-time content modules for "${environment}" in ${outDir}`);

async function generateHomeContent(): Promise<void> {
	const source = createContentSource({ environment, baseUrl: contentBaseUrl });
	const page = await source.getPage('/');
	const homeContent: HomeContent = {
		introduction: await source.readText(page, 'introduction'),
		settings: await source.readJson(page, 'settings')
	};

	await writeModule(
		'home.ts',
		createTypeScriptModule({
			imports: ["import type { HomeContent } from '../../types/content.types';"],
			exports: [{ name: 'homeContent', type: 'HomeContent', value: homeContent }]
		})
	);
}

async function generateUprnContent(): Promise<void> {
	const localConfig = await readJsonFile<LocalAppsUprnConfig>(
		resolve(projectRoot, 'static/config/apps/uprn/config.json')
	);
	const uprnAppConfig = await generateUprnAppConfig({
		localConfig,
		environment,
		contentBaseUrl
	});

	await writeModule(
		'uprn.ts',
		createTypeScriptModule({
			imports: ["import type { AppsUprnConfig } from '@dsh/uprn-service';"],
			exports: [{ name: 'uprnAppConfig', type: 'AppsUprnConfig', value: uprnAppConfig }]
		})
	);
}

async function writeModule(fileName: string, content: string): Promise<void> {
	const filePath = resolve(outDir, fileName);
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, content, 'utf8');
}

async function readJsonFile<T>(filePath: string): Promise<T> {
	return JSON.parse(await readFile(filePath, 'utf8')) as T;
}
