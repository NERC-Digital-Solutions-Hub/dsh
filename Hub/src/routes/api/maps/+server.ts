import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MapsConfig } from '$lib/models/maps-config';
import { dev } from '$app/environment';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { asset, base } from '$app/paths';

let mapsConfig: MapsConfig | null = null;

export const GET: RequestHandler = async ({ url, fetch }) => {
	if (!mapsConfig) {
		mapsConfig = await getMapsConfig(fetch);
	}

	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, 'Missing id parameter');
	}

	try {
		// Try to fetch existing file from static directory
		console.log('Fetching map data from:', asset(`/api/maps/${id}.json`), 'id', id);
		const fileUrl = asset(`/api/maps/${id}.json`);
		const fileResponse = await fetch(fileUrl);

		if (fileResponse.ok) {
			const data = await fileResponse.json();

			// Check if file is empty or has no results
			if (
				!data ||
				(Array.isArray(data.results) && data.results.length === 0) ||
				Object.keys(data).length === 0
			) {
				throw new Error('Empty data');
			}

			return json(data);
		} else {
			// File doesn't exist, fetch and create it
			throw new Error('No data');
		}
	} catch (err) {
		console.error('Error loading map data:', err);
		throw error(500, 'Failed to load map configuration');
	}
};

async function getMapsConfig(fetch: typeof global.fetch): Promise<MapsConfig> {
	const response = await fetch(asset('/config/maps/config.json'));

	if (!response.ok) {
		throw error(500, `Failed to load maps config: ${response.status}`);
	}

	const config = await response.json();
	const instance = new MapsConfig(config.organisations);
	return instance;
}
