import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
	}
});
