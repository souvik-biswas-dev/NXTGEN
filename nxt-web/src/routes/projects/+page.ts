import { Platform, Projects } from '$lib/api/endpoints';
import type { Project } from '$lib/api/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
	const city = url.searchParams.get('city') ?? undefined;
	const [items, platform] = await Promise.all([
		Projects.list(city, fetch).then((r) => r.items).catch(() => [] as Project[]),
		Platform.all(fetch).catch(() => ({}) as Record<string, unknown>)
	]);
	return {
		items,
		city: city ?? '',
		cities: (platform.popular_cities ?? []) as { id: string; name: string }[]
	};
};
