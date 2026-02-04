import { researchPageLoad } from '@dsh/research-page';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		researchPageLoad,
		title: 'Research'
	};
};
