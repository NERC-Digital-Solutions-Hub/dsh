import { uprnAppConfig } from '$lib/generated/content/uprn';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		uprnAppConfig
	};
};
