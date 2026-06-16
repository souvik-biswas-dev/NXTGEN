import { Platform, Projects, Properties } from '$lib/api/endpoints';
import type {
	AboutFeature,
	MarketTrend,
	PopularCity,
	Project,
	Property
} from '$lib/api/types';
import type { PageLoad } from './$types';

/**
 * Home data is loaded universally (SSR + client) for SEO. The backend may be
 * offline during a static build, so every fetch degrades gracefully to a
 * fallback rather than throwing.
 */
export const load: PageLoad = async ({ fetch }) => {
	const [featured, projects, platform] = await Promise.all([
		Properties.list({ limit: 6 }, fetch).then((r) => r.items).catch(() => [] as Property[]),
		Projects.list(undefined, fetch).then((r) => r.items.slice(0, 4)).catch(() => [] as Project[]),
		Platform.all(fetch).catch(() => ({}) as Record<string, unknown>)
	]);

	return {
		featured,
		projects,
		cities: (platform.popular_cities ?? []) as PopularCity[],
		trends: (platform.market_trends ?? []) as MarketTrend[],
		features: (platform.about_features ?? []) as AboutFeature[]
	};
};
