import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import esriRequest from '@arcgis/core/request.js';

// Helper to parse args
function getArg(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	return index > -1 ? process.argv[index + 1] : undefined;
}

async function fetchItems(url: string, baseQuery: string, targetCount: number = 500) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let allResults: any[] = [];
	let start = 1;
	const num = 100; // Max per request usually

	process.stdout.write(`    Fetching items... 0/${targetCount}\r`);

	while (allResults.length < targetCount) {
		const response = await esriRequest(url, {
			query: {
				q: baseQuery,
				num: num.toString(),
				start: start.toString(),
				f: 'json'
			},
			responseType: 'json'
		});

		const results = response.data.results || [];
		if (results.length === 0) break;

		allResults = [...allResults, ...results];
		process.stdout.write(`    Fetching items... ${allResults.length}/${targetCount}\r`);

		// If we got fewer than requested, we're probably done
		if (results.length < num) break;

		start += num;

		// Check if nextStart is -1 or missing, which might indicate end of results
		if (response.data.nextStart === -1) break;
	}
	console.log(''); // New line after progress

	// Trim to target count if we somehow got more
	return allResults.slice(0, targetCount);
}

async function fetchSinglePortalData() {
	const id = getArg('--id');
	const name = getArg('--name');
	const portalUrl = getArg('--url');
	const endpoint = getArg('--endpoint');
	const queryParamsStr = getArg('--params');
	const countArg = getArg('--count');
	const targetCount = countArg ? parseInt(countArg, 10) : 500;

	if (!id || !name || !portalUrl || !endpoint) {
		console.error('Missing required arguments: --id, --name, --url, --endpoint');
		process.exit(1);
	}

	const queryParams = queryParamsStr ? JSON.parse(queryParamsStr) : {};

	console.log(`Processing: ${name} (${id})`);

	try {
		const url = portalUrl + endpoint;

		// Build query parameters from config
		const formattedQueryParams = Object.entries(queryParams)
			.map(([key, value]) => `${key}:"${value}"`)
			.join(' AND ');

		console.log(`  Fetching from: ${url}`);

		// Fetch Web Maps (up to targetCount)
		const webMapQuery =
			`type:"Web Map"` + (formattedQueryParams ? ` AND ${formattedQueryParams}` : '');
		console.log(`  Fetching Web Maps...`);
		const webMapResults = await fetchItems(url, webMapQuery, targetCount);

		// Fetch Layers (up to targetCount)
		const LAYER_TYPES = [
			'Feature Layer',
			'Feature Service',
			'Map Service',
			'Image Service',
			'Tile Service',
			'Vector Tile Service',
			'Scene Service',
			'Stream Service',
			'3DTilesService'
		];
		const layerQuery =
			`type:(${LAYER_TYPES.map((type) => `"${type}"`).join(' OR ')})` +
			(formattedQueryParams ? ` AND ${formattedQueryParams}` : '');
		console.log(`  Fetching Layers...`);
		const layerResults = await fetchItems(url, layerQuery, targetCount);

		// Merge the results
		const mergedResults = [...webMapResults, ...layerResults];

		const mergedData = {
			total: mergedResults.length,
			start: 1,
			num: mergedResults.length,
			nextStart: -1,
			results: mergedResults
		};

		console.log(`  Retrieved ${webMapResults.length} Web Maps`);
		console.log(`  Retrieved ${layerResults.length} Layers`);
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
		const outputPath = join(outputDir, `${id}.json`);

		await mkdir(outputDir, { recursive: true });
		await writeFile(outputPath, JSON.stringify(mergedData, null, 4), 'utf-8');

		console.log(`  ✓ Saved to: ${outputPath}\n`);
	} catch (error) {
		console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}\n`);
		process.exit(1);
	}
}

fetchSinglePortalData().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
