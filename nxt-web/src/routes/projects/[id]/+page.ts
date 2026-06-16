import { error } from '@sveltejs/kit';
import { Projects } from '$lib/api/endpoints';
import { ApiError } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const project = await Projects.get(params.id, fetch);
		return { project };
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) error(404, 'Project not found');
		error(503, 'Unable to load this project — is the backend running?');
	}
};
