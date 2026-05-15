import type { PageLoad } from './$types';
import { appsContent } from '$lib/generated/content/apps';

export const load: PageLoad = async () => {
	return {
		title: 'Apps',
		appsContent
	};
};
