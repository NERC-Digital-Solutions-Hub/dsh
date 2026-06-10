import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// ArcGIS is loaded at runtime from the CDN via window.$arcgis.import() and must never be
	// bundled or dep-optimised.
	optimizeDeps: {
		exclude: ['@arcgis/core', '@arcgis/map-components']
	}
});
