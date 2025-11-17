import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MapsConfig } from '$lib/models/maps-config';
import { dev } from '$app/environment';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

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
		const fileUrl = `/api/maps/${id}.json`;
		const fileResponse = await fetch(fileUrl);

		if (fileResponse.ok) {
			const data = await fileResponse.json();

			// Check if file is empty or has no results
			if (
				!data ||
				(Array.isArray(data.results) && data.results.length === 0) ||
				Object.keys(data).length === 0
			) {
				// Fetch and populate
				const fetchedData = await fetchAndSaveMapData(id, fetch);
				return json(fetchedData);
			}

			return json(data);
		} else {
			// File doesn't exist, fetch and create it
			const fetchedData = await fetchAndSaveMapData(id, fetch);
			return json(fetchedData);
		}
	} catch (err) {
		console.error('Error loading map data:', err);
		throw error(500, 'Failed to load map configuration');
	}
};

async function fetchAndSaveMapData(id: string, fetch: typeof global.fetch) {
	if (!mapsConfig) {
		throw error(500, 'Maps configuration not loaded');
	}

	// Find the organisation config by id
	const orgConfig = mapsConfig.organisations.find((org) => org.id === id);

	if (!orgConfig) {
		throw error(404, `Organisation configuration '${id}' not found`);
	}

	try {
		// Build the query URL
		const queryUrl = new URL(orgConfig.endpoint, orgConfig.portalUrl);
		queryUrl.searchParams.set('f', 'json');
		queryUrl.searchParams.set('num', '100');

		// Add any additional query params from config
		if (orgConfig.queryParams) {
			Object.entries(orgConfig.queryParams).forEach(([key, value]) => {
				queryUrl.searchParams.set(key, value);
			});
		}

		// Fetch from the portal
		const response = await fetch(queryUrl.toString());

		if (!response.ok) {
			throw error(response.status, `Failed to fetch from portal: ${response.statusText}`);
		}

		const data = await response.json();

		// Only write to filesystem in development mode
		if (dev) {
			const filePath = join(process.cwd(), 'static', 'api', 'maps', `${id}.json`);
			// Ensure directory exists
			await mkdir(dirname(filePath), { recursive: true });
			// Save the fetched data
			await writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
		}

		return data;
	} catch (err) {
		console.error('Error fetching map data:', err);
		throw error(500, 'Failed to fetch map data from portal');
	}
}

async function getMapsConfig(fetch: typeof global.fetch): Promise<MapsConfig> {
	const response = await fetch('/config/maps/config.json');

	if (!response.ok) {
		throw error(500, `Failed to load maps config: ${response.status}`);
	}

	const config = await response.json();
	const instance = new MapsConfig(config.organisations);
	return instance;
}
