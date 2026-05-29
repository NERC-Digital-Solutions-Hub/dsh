import type { PageLoad } from './$types';
import { uprnAppConfig } from '$lib/generated/content/uprn';

export const ssr = false;

export const load: PageLoad = async () => {
	return {
		title: 'UPRN Service',
		description: 'Select areas, choose datasets, export UPRN results, and download files.',
		uprnAppConfig
	};
};
