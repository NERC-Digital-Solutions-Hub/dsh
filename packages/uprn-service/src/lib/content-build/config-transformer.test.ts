import { TreeviewNodeTypology } from '$lib/types/treeview.types';
import { expect, test } from 'vitest';
import { ConfigTransformer } from './config-transformer';
import { CsvConfigFetcher } from './csv-config-fetcher';

test('builds a treeview with synthesized folders and resolved dependencies', async () => {
	const fetcher = new CsvConfigFetcher(
		'https://example.test/datasets.csv',
		'https://example.test/variables.csv',
		'https://example.test/folders.csv',
		createCsvFetch(
			new Map([
				['https://example.test/datasets.csv', datasetsCsv],
				['https://example.test/variables.csv', variablesCsv],
				['https://example.test/folders.csv', foldersCsv]
			])
		)
	);
	const csvConfig = await fetcher.fetch();

	expect(csvConfig.folders.map((folder) => `${folder.tvPath}/${folder.folderName}`)).toEqual([
		'//Group',
		'/Group/Dataset A/Sub'
	]);

	const layers = new ConfigTransformer().transform(csvConfig);
	const group = layers.find((layer) => layer.id === 'folder:/Group');
	expect(group?.typology).toBe(TreeviewNodeTypology.Folder);

	const datasetA = group?.children?.find((node) => node.id === 'layer-a');
	const datasetB = group?.children?.find((node) => node.id === 'layer-b');
	const subFolder = datasetA?.children?.find((node) => node.id === 'folder:/Group/Dataset A/Sub');

	expect(subFolder?.typology).toBe(TreeviewNodeTypology.Folder);
	expect(subFolder?.children?.[0]?.id).toBe('layer-a-var1');
	expect(datasetB?.visibilityDependencyIds).toEqual(['layer-a']);
});

const datasetsCsv = [
	'DbId,WmId,TvTitle,WmLayerType,WmItemId,WmUrl,DatasetName,HasDependants,IsListed,IsEnabled,TvType,TvPath,Order,MetadataId,MetadataConfigUrl,TreeviewId,VisibilityGroupId,IsOpenOnInit,IsRenderedOnInit,DisableRendering,DisabledReason',
	'1,layer-a,Dataset A,1,,,Dataset A,,true,true,1,/Group,1,,,2,,false,false,false,',
	'2,layer-b,Dataset B,1,,,Dataset B,Dataset A,true,true,1,/Group,2,,,2,,false,false,false,'
].join('\n');

const variablesCsv = [
	'DbId,DatasetName,Order,TvVariableName,TvVariableLabel,HasDependants,IsListed,IsEnabled,DefaultExported,TvVariablePath,TvTags,TvMetadataConfigUrl,TreeviewId,VisibilityGroupId,IsOpenOnInit,IsRenderedOnInit,DisableRendering,DisabledReason,AlternativeTitle,MetadataTabInfoUrl',
	'1,Dataset A,1,var1,Variable One,,true,true,,Sub,,metadata.json,2,,false,false,false,,,'
].join('\n');

const foldersCsv =
	'DbId,FolderName,IsListed,IsEnabled,TvPath,TvTitle,Order,MetadataConfigUrl,TreeviewId,IsOpenOnInit,DisabledReason,Description\n';

function createCsvFetch(responses: Map<string, string>): typeof fetch {
	return (async (input: string | URL | Request) => {
		const url = input.toString();
		const value = responses.get(url);
		if (value === undefined) {
			return new Response('not found', { status: 404, statusText: 'Not Found' });
		}

		return new Response(value, { status: 200 });
	}) as typeof fetch;
}
