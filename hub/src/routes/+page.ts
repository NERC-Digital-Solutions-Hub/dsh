import type { PageLoad } from './$types';
import { homeContent } from '$lib/generated/content/home';

export const load: PageLoad = async () => {
	return {
		title: 'Home',
		homeContent
	};
};
