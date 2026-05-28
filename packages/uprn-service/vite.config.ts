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
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
