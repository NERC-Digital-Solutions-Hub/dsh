// import type { UprnConfiguration } from '$lib/Types/Uprn.types';
// import { UprnConfigurationStore } from './UprnConfigurationStore.svelte';

// let storeInstance = $state<UprnConfigurationStore>();

// export const uprnConfigStore = {
// 	get instance() {
// 		return storeInstance;
// 	},
// 	async load(url: string) {
// 		const response = await fetch(url);
// 		if (!response.ok) {
// 			throw new Error(`Failed to load UPRN config from ${url}`);
// 		}

// 		const config = (await response.json()) as UprnConfiguration;
// 		const storeInstanceLocal = new UprnConfigurationStore();
// 		await storeInstanceLocal.init(config);
// 		storeInstance = storeInstanceLocal;
// 		return storeInstance;
// 	}
// };
