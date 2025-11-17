import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import esriRequest from '@arcgis/core/request.js';

type OrganisationQueryParams = {
	orgid?: string;
	[key: string]: string | undefined;
};

type MapsOrganisationConfig = {
	id: string;
	name: string;
	portalUrl: string;
	endpoint: string;
	queryParams?: OrganisationQueryParams;
};

type MapsConfig = {
	organisations: MapsOrganisationConfig[];
};

async function fetchPortalData() {
	console.log('Starting portal data fetch...\n');

	// Read the maps config
	const configPath = join(process.cwd(), 'static', 'config', 'maps', 'config.json');
	const configContent = await readFile(configPath, 'utf-8');
	const mapsConfig: MapsConfig = JSON.parse(configContent);

	console.log(`Found ${mapsConfig.organisations.length} organisations\n`);

	// Process each organisation
	for (const org of mapsConfig.organisations) {
		console.log(`Processing: ${org.name} (${org.id})`);

		try {
			const url = org.portalUrl + org.endpoint;

			// Build query parameters from config
			const queryParams = org.queryParams || {};
			const formattedQueryParams = Object.entries(queryParams)
				.map(([key, value]) => `${key}:"${value}"`)
				.join(' AND ');

			console.log(`  Fetching from: ${url}`);

			// Fetch Web Maps (up to 100)
			const webMapQuery =
				`type:"Web Map"` + (formattedQueryParams ? ` AND ${formattedQueryParams}` : '');
			console.log(`  Fetching Web Maps...`);
			const webMapResponse = await esriRequest(url, {
				query: {
					q: webMapQuery,
					num: '100',
					f: 'json'
				},
				responseType: 'json'
			});

			// Fetch Layers (up to 100)
			const LAYER_TYPES = [
				'Feature Layer',
				'Feature Service',
				'Map Service',
				'Image Service',
				'Tile Service'
			];
			const layerQuery =
				`type:(${LAYER_TYPES.map((type) => `"${type}"`).join(' OR ')})` +
				(formattedQueryParams ? ` AND ${formattedQueryParams}` : '');
			console.log(`  Fetching Layers...`);
			const layerResponse = await esriRequest(url, {
				query: {
					q: layerQuery,
					num: '100',
					f: 'json'
				},
				responseType: 'json'
			});

			// Merge the results
			const webMapData = webMapResponse.data;
			const layerData = layerResponse.data;

			const mergedResults = [...(webMapData.results || []), ...(layerData.results || [])];

			const mergedData = {
				total: mergedResults.length,
				start: 1,
				num: mergedResults.length,
				nextStart: -1,
				results: mergedResults
			};

			console.log(`  Retrieved ${webMapData.results?.length || 0} Web Maps`);
			console.log(`  Retrieved ${layerData.results?.length || 0} Layers`);
			console.log(`  Total merged: ${mergedResults.length} items`);

			// Log warnings if no results
			if (mergedResults.length === 0) {
				console.log('  ⚠ Warning: No items returned. Possible reasons:');
				console.log('    - Organization requires authentication');
				console.log('    - No public items available');
				console.log('    - Incorrect orgid or endpoint');
				console.log('    - Consider using a group-specific endpoint instead');
			}

			// Count item types
			const typeCounts: Record<string, number> = {};
			mergedResults.forEach((item: { type?: string }) => {
				const type = item.type || 'Unknown';
				typeCounts[type] = (typeCounts[type] || 0) + 1;
			});

			console.log('  Item types:');
			Object.entries(typeCounts)
				.sort(([, a], [, b]) => b - a)
				.forEach(([type, count]) => {
					console.log(`    - ${type}: ${count}`);
				});

			// Save to file
			const outputDir = join(process.cwd(), 'static', 'api', 'maps');
			const outputPath = join(outputDir, `${org.id}.json`);

			await mkdir(outputDir, { recursive: true });
			await writeFile(outputPath, JSON.stringify(mergedData, null, 4), 'utf-8');

			console.log(`  ✓ Saved to: ${outputPath}\n`);
		} catch (error) {
			console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
		}
	}

	console.log('Portal data fetch complete!');
}

// Run the script
fetchPortalData().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
