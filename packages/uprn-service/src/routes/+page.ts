import { uprnAppConfig } from '../generated/content/uprn';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		uprnAppConfig
	};
};
