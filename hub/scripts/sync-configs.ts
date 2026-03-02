import fs from 'node:fs';
import path from 'node:path';

const packages = [
	'ai-catalogue',
	'uprn-service',
	'maps-page',
	'research-page',
	'ai-where-to-build'
];

// Ensure we are using the project root (hub)
const projectRoot = process.cwd();
const targetDir = path.resolve(projectRoot, 'static/config');

const keepDirName = 'home';
const keepDir = path.join(targetDir, keepDirName);

// Ensure target exists
fs.mkdirSync(targetDir, { recursive: true });

// Delete everything in targetDir except "home"
for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
	if (entry.name === keepDirName) continue;

	const entryPath = path.join(targetDir, entry.name);
	fs.rmSync(entryPath, { recursive: true, force: true });
}

// Ensure home dir exists (optional)
fs.mkdirSync(keepDir, { recursive: true });

packages.forEach((pkg) => {
	const srcDir = path.resolve(projectRoot, `../packages/${pkg}/static/config`);

	if (fs.existsSync(srcDir)) {
		console.log(`Syncing config from ${pkg}...`);
		fs.cpSync(srcDir, targetDir, { recursive: true, force: true });
	}
});
