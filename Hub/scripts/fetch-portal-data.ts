import { readFile } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

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

async function runScript(scriptPath: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		// Use npx tsx to run the typescript file
		const child = spawn('npx', ['tsx', scriptPath, ...args], {
			stdio: 'inherit',
			shell: true
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Script exited with code ${code}`));
			}
		});

		child.on('error', (err) => {
			reject(err);
		});
	});
}

async function fetchPortalData() {
	console.log('Starting portal data fetch...\n');

	// Read the maps config
	const configPath = join(process.cwd(), 'static', 'config', 'maps', 'config.json');
	const configContent = await readFile(configPath, 'utf-8');
	const mapsConfig: MapsConfig = JSON.parse(configContent);

	console.log(`Found ${mapsConfig.organisations.length} organisations\n`);

	const scriptPath = join(process.cwd(), 'scripts', 'fetch-single-portal-data.ts');

	// Process each organisation
	for (const org of mapsConfig.organisations) {
		const args = [
			'--id',
			org.id,
			'--name',
			org.name,
			'--url',
			org.portalUrl,
			'--endpoint',
			org.endpoint
		];

		if (org.queryParams) {
			args.push('--params', JSON.stringify(org.queryParams));
		}

		try {
			await runScript(scriptPath, args);
		} catch (e) {
			console.error(`Failed to process ${org.name}:`, e);
		}
	}

	console.log('Portal data fetch complete!');
}

// Run the script
fetchPortalData().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
