import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		title: 'UPRN Service',
		description: 'Select areas, choose datasets, export UPRN results, and download files.'
	};
};
