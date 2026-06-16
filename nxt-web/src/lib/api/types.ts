/** Shared API types — mirror the backend's JSON (Drizzle returns camelCase). */

export type PropertyType = 'buy' | 'rent';
export type PropertyCategory = 'residential' | 'commercial';
export type Possession = 'ready' | 'under-construction';
export type Role = 'buyer' | 'owner' | 'broker' | 'admin';

/** Public profile attached to a property's owner/broker (phone/email stripped). */
export interface Profile {
	id?: string;
	userId: string;
	name: string | null;
	role?: Role;
	avatarUrl?: string | null;
	rating?: string | number | null;
	verifiedBroker?: boolean;
	email?: string | null;
	phone?: string | null;
}

/** `/auth/me` and login `user` — note the nested `profile`. */
export interface Me {
	id: string;
	email: string | null;
	phone: string | null;
	emailVerified?: boolean;
	phoneVerified?: boolean;
	profile: Profile;
}

export interface Property {
	id: string;
	title: string;
	description: string | null;
	price: number;
	maintenance?: number | null;
	deposit?: number | null;
	type: PropertyType;
	category: PropertyCategory;
	bhk: string;
	furnishing: string;
	areaSqft: number;
	carpetArea?: number | null;
	superBuiltUp?: number | null;
	photos: string[];
	locality: string;
	city: string;
	address?: string | null;
	floor?: string | null;
	totalFloors?: string | null;
	facing?: string | null;
	possession: Possession;
	ageYears?: number | null;
	amenities: string[];
	ownerId?: string | null;
	brokerId?: string | null;
	verified: boolean;
	featured: boolean;
	bedrooms: number;
	bathrooms: number;
	kitchens: number;
	parkings: number;
	latitude?: number | null;
	longitude?: number | null;
	createdAt?: string;
	updatedAt?: string;
	owner?: Profile | null;
	broker?: Profile | null;
}

export interface Project {
	id: string;
	name: string;
	developer: string;
	location: string;
	city: string;
	locality?: string | null;
	description?: string | null;
	priceMin?: number | null;
	priceMax?: number | null;
	launchDate?: string | null;
	possessionDate?: string | null;
	reraId?: string | null;
	coverImage?: string | null;
	gallery: string[];
	floorPlans?: { name: string; area?: number; price?: number }[];
	amenities: string[];
	totalUnits?: number | null;
	availableUnits?: number | null;
	towerCount?: number | null;
	featured: boolean;
	verified: boolean;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: Me;
}

export interface Paged<T> {
	items: T[];
	hasMore?: boolean;
	ids?: string[];
}

/* ── Platform CMS blobs ───────────────────────────────────────────── */
export interface PopularCity {
	id: string;
	name: string;
	properties: number;
}
export interface MarketTrend {
	city: string;
	trend: 'up' | 'down';
	change: string;
	avgPrice: string;
	period: string;
}
export interface SubscriptionPlan {
	plan: string;
	name: string;
	price: number;
	maxListings: number | null;
	features: string[];
}
export interface HomeLoanPartner {
	id: string;
	name: string;
	interest: string;
	processingFee: string;
	maxTenure: number;
}
export interface AboutFeature {
	icon: string;
	title: string;
	description: string;
}
export interface FaqGroup {
	category: string;
	items: { q: string; a: string }[];
}

export interface PropertyFilters {
	q?: string;
	city?: string;
	locality?: string;
	type?: PropertyType;
	category?: PropertyCategory;
	minPrice?: number;
	maxPrice?: number;
	minArea?: number;
	maxArea?: number;
	bhk?: string;
	furnishing?: string;
	facing?: string;
	possession?: Possession;
	ownerOnly?: boolean;
	sort?: 'price_low_high' | 'price_high_low' | 'area_low_high' | 'area_high_low';
	limit?: number;
	offset?: number;
}
