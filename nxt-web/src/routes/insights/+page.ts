import { Platform } from '$lib/api/endpoints';
import type { FaqGroup, MarketTrend, SubscriptionPlan } from '$lib/api/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const platform = await Platform.all(fetch).catch(() => ({}) as Record<string, unknown>);
	return {
		trends: (platform.market_trends ?? []) as MarketTrend[],
		plans: (platform.subscription_plans ?? []) as SubscriptionPlan[],
		faqs: (platform.faqs ?? []) as FaqGroup[]
	};
};
