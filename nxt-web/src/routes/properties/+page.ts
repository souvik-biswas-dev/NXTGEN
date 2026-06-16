import { Platform, Properties } from '$lib/api/endpoints';
import type { PropertyFilters, Property } from '$lib/api/types';
import type { PageLoad } from './$types';

const PAGE = 24;

export const load: PageLoad = async ({ url, fetch }) => {
	const sp = url.searchParams;
	const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);

	const filters: PropertyFilters = {
		q: sp.get('q') ?? undefined,
		city: sp.get('city') ?? undefined,
		locality: sp.get('locality') ?? undefined,
		type: (sp.get('type') as PropertyFilters['type']) ?? undefined,
		category: (sp.get('category') as PropertyFilters['category']) ?? undefined,
		bhk: sp.get('bhk') ?? undefined,
		furnishing: sp.get('furnishing') ?? undefined,
		facing: sp.get('facing') ?? undefined,
		possession: (sp.get('possession') as PropertyFilters['possession']) ?? undefined,
		minPrice: num('minPrice'),
		maxPrice: num('maxPrice'),
		minArea: num('minArea'),
		maxArea: num('maxArea'),
		sort: (sp.get('sort') as PropertyFilters['sort']) ?? undefined,
		ownerOnly: sp.get('ownerOnly') === 'true' || undefined,
		limit: PAGE,
		offset: 0
	};

	const [res, platform] = await Promise.all([
		Properties.list(filters, fetch).catch(() => ({ items: [] as Property[], hasMore: false })),
		Platform.all(fetch).catch(() => ({}) as Record<string, unknown>)
	]);

	return {
		filters,
		items: res.items,
		hasMore: res.hasMore ?? false,
		pageSize: PAGE,
		cities: (platform.popular_cities ?? []) as { id: string; name: string }[],
		priceRanges: (platform.price_ranges ?? {}) as Record<string, { label: string; min: number; max: number | null }[]>
	};
};
