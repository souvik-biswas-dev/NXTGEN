import { Platform } from '$lib/api/endpoints';
import type { HomeLoanPartner } from '$lib/api/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const partners = await Platform.key<HomeLoanPartner[]>('home_loan_partners', fetch).catch(
		() => [] as HomeLoanPartner[]
	);
	return { partners };
};
