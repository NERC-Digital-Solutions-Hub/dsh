import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const svelteSsrPackages = [
	'@keenmate/svelte-treeview',
	'@lucide/svelte',
	'bits-ui',
	'mode-watcher',
	'svelte-lightbox',
	'svelte-sonner'
];

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		noExternal: svelteSsrPackages
	},
	// ArcGIS is loaded at runtime from the CDN via window.$arcgis.import() and must never be
	// bundled or dep-optimised (it is huge and causes out-of-memory during the build).
	optimizeDeps: {
		exclude: ['@arcgis/core', '@arcgis/map-components']
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
