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
import { type AppsContent, type HomeContent } from '../src/lib/types/content.types';
import type { NavItem } from '../src/lib/types/nav.types';

const projectRoot = resolve(import.meta.dirname, '..');
const outDir = resolve(projectRoot, 'src/lib/generated/content');
const environment = resolveContentEnvironment(process.env.PUBLIC_DSH_ENVIRONMENT);
const contentBaseUrl = resolveDshContentBaseUrl(
	process.env.PUBLIC_DSH_CONTENT_BASE_URL || DEFAULT_DSH_CONTENT_BASE_URL
);
const contentAssetFieldNames = new Set([
	'image',
	'images',
	'imageurl',
	'imageurls',
	'thumbnail',
	'thumbnails',
	'thumbnailurl',
	'thumbnailurls',
	'icon',
	'icons',
	'iconurl',
	'iconurls',
	'logo',
	'logos',
	'logourl',
	'logourls',
	'src'
]);

await Promise.all([
	generateHomeContent(),
	generateAppsContent(),
	generateNavigationContent(),
	generateUprnContent()
]);

console.log(`[hub/content] Generated build-time content modules for "${environment}" in ${outDir}`);

async function generateHomeContent(): Promise<void> {
	const source = createContentSource({ environment, baseUrl: contentBaseUrl });
	const page = await source.getPage('/');
	const homeContent: HomeContent = {
		introduction: await source.readText(page, 'introduction'),
		body: await source.readJson(page, 'content'),
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

async function generateAppsContent(): Promise<void> {
	const source = createContentSource({ environment, baseUrl: contentBaseUrl });
	const page = await source.getPage('/apps');
	const appsContent = resolveContentAssetUrls(
		await source.readJson<AppsContent>(page, 'apps'),
		contentBaseUrl
	);

	await writeModule(
		'apps.ts',
		createTypeScriptModule({
			imports: ["import type { AppsContent } from '../../types/content.types';"],
			exports: [{ name: 'appsContent', type: 'AppsContent', value: appsContent }]
		})
	);
}

async function generateNavigationContent(): Promise<void> {
	const source = createContentSource({ environment, baseUrl: contentBaseUrl });
	const page = await source.getPage('/');
	const navigationContent = await source.readJson<{ items: NavItem[] }>(page, 'navigation');

	await writeModule(
		'navigation.ts',
		createTypeScriptModule({
			imports: ["import type { NavItem } from '../../types/nav.types';"],
			exports: [{ name: 'navigation', type: 'NavItem[]', value: navigationContent.items }]
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

function resolveContentAssetUrls<T>(value: T, baseUrl: string): T {
	return resolveContentAssetValue(value, baseUrl) as T;
}

function resolveContentAssetValue(value: unknown, baseUrl: string, fieldName = ''): unknown {
	if (typeof value === 'string') {
		return isContentAssetField(fieldName) ? resolveContentRootUrl(value, baseUrl) : value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => resolveContentAssetValue(item, baseUrl, fieldName));
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, nestedValue]) => [
				key,
				resolveContentAssetValue(nestedValue, baseUrl, key)
			])
		);
	}

	return value;
}

function isContentAssetField(fieldName: string): boolean {
	return contentAssetFieldNames.has(fieldName.toLowerCase());
}

function resolveContentRootUrl(path: string, baseUrl: string): string {
	const trimmed = path.trim();
	if (!trimmed) {
		return '';
	}

	try {
		return new URL(trimmed).toString();
	} catch {
		return new URL(trimmed.replace(/^\/+/, ''), baseUrl).toString();
	}
}
