import { error } from '@sveltejs/kit';
import { Properties } from '$lib/api/endpoints';
import { ApiError } from '$lib/api/client';
import type { Property } from '$lib/api/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	let property: Property;
	try {
		property = await Properties.get(params.id, fetch);
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) error(404, 'Property not found');
		error(503, 'Unable to load this property — is the backend running?');
	}

	const similar = await Properties.similar(params.id, 4, fetch)
		.then((r) => r.items)
		.catch(() => [] as Property[]);

	return { property, similar };
};
