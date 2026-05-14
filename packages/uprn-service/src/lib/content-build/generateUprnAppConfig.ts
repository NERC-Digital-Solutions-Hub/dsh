import {
	DEFAULT_DSH_CONTENT_BASE_URL,
	createContentSource,
	resolveContentEnvironment,
	resolveDshContentBaseUrl
} from '@dsh/content';
import type { CustomRenderers } from '$lib/Types/CustomRenderers.types';
import type {
	AppsUprnConfig,
	GeneralSettings,
	LocalAppsUprnConfig
} from '$lib/Types/Configuration.types';
import { ConfigTransformer } from './configTransformer';
import { CsvConfigFetcher } from './csvConfigFetcher';

export type GenerateUprnAppConfigOptions = {
	localConfig: LocalAppsUprnConfig;
	environment?: string | null;
	contentBaseUrl?: string | null;
	fetch?: typeof fetch;
};

type ContentManifestAsset = {
	path: string;
	type: string;
};

type UprnPageAssets = Record<string, ContentManifestAsset>;

export async function generateUprnAppConfig(
	options: GenerateUprnAppConfigOptions
): Promise<AppsUprnConfig> {
	const environment = resolveContentEnvironment(options.environment);
	const contentBaseUrl = resolveDshContentBaseUrl(
		options.contentBaseUrl || DEFAULT_DSH_CONTENT_BASE_URL
	);
	const fetchImpl = options.fetch ?? fetch;
	const source = createContentSource({ environment, baseUrl: contentBaseUrl, fetch: fetchImpl });
	const page = await source.getPage<UprnPageAssets>('/apps/uprn-service');

	const [settings, introductionMarkdown, customRenderers] = await Promise.all([
		source.readJson<GeneralSettings>(page, 'settings'),
		source.readText(page, 'introduction'),
		source.readJson<CustomRenderers>(page, 'climatejust-renderers')
	]);

	const csvConfig = await new CsvConfigFetcher(
		source.resolvePageFileUrl(page, 'generated.csv.config.datasets'),
		source.resolvePageFileUrl(page, 'generated.csv.config.variables'),
		source.resolvePageFileUrl(page, 'generated.csv.config.folders'),
		fetchImpl
	).fetch();
	const layers = new ConfigTransformer().transform(csvConfig);

	return {
		map: options.localConfig.mapConfig,
		content: {
			settings,
			introductionMarkdown,
			customRenderers
		},
		uprnDownload: options.localConfig.uprnDownload,
		aiUprnChatbot: options.localConfig.aiUprnChatbot,
		treeviewConfig: {
			...options.localConfig.mapConfig.treeview,
			layers: [...layers]
		}
	};
}
