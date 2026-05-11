import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	fetchHubIntroduction,
	fetchHubSettings,
	fetchUprnCustomRenderers,
	fetchUprnIntroduction,
	fetchUprnSettings,
	fetchUprnTreeviewLayersPayload,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from './dsh-content-source';

export type GenerateStaticContentApiOptions = {
	outDir: string;
	environment?: string;
	contentBaseUrl?: string;
};

type StaticEndpoint = {
	path: string;
	content: string;
};

export async function generateStaticContentApi(
	options: GenerateStaticContentApiOptions
): Promise<void> {
	const outDir = resolve(options.outDir);
	const environment = resolveContentEnvironment(options.environment);
	const contentBaseUrl = resolveDshContentBaseUrl(
		options.contentBaseUrl || DEFAULT_DSH_CONTENT_BASE_URL
	);
	const sourceOptions = { environment, contentBaseUrl };

	await rm(outDir, { recursive: true, force: true });

	const [
		hubIntroduction,
		hubSettings,
		uprnIntroduction,
		uprnSettings,
		uprnCustomRenderers,
		uprnTreeviewLayers
	] = await Promise.all([
		fetchHubIntroduction(sourceOptions),
		fetchHubSettings(sourceOptions),
		fetchUprnIntroduction(sourceOptions),
		fetchUprnSettings(sourceOptions),
		fetchUprnCustomRenderers(sourceOptions),
		fetchUprnTreeviewLayersPayload(sourceOptions)
	]);

	const endpoints: StaticEndpoint[] = [
		{ path: 'hub/introduction.md', content: hubIntroduction },
		{ path: 'hub/settings.json', content: toJson(hubSettings) },
		{ path: 'uprn/introduction.md', content: uprnIntroduction },
		{ path: 'uprn/settings.json', content: toJson(uprnSettings) },
		{ path: 'uprn/custom-renderers.json', content: toJson(uprnCustomRenderers) },
		{ path: 'uprn/treeview-layers.json', content: toJson(uprnTreeviewLayers) }
	];

	await Promise.all(
		endpoints.map(async (endpoint) => {
			const filePath = resolve(outDir, endpoint.path);
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, endpoint.content, 'utf8');
		})
	);

	console.log(
		`[content] Generated ${endpoints.length} endpoint files for "${environment}" in ${outDir}`
	);
}

function toJson(value: unknown): string {
	return `${JSON.stringify(value, null, 2)}\n`;
}
