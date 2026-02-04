import { researchPageLoad } from '@dsh/research-page';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const data = await researchPageLoad(event);
	return {
		...data,
		title: 'Research'
	};
};
