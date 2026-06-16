import { api } from './client';
import type {
	AuthResponse,
	Me,
	Paged,
	Project,
	Property,
	PropertyFilters
} from './types';

type Fetcher = typeof fetch;
const f = (fetcher?: Fetcher) => (fetcher ? { fetcher } : {});

/* ── Properties ──────────────────────────────────────────────────── */
export const Properties = {
	list: (filters: PropertyFilters = {}, fetcher?: Fetcher) =>
		api.get<Paged<Property>>('/properties', filters as Record<string, unknown>, f(fetcher)),

	get: (id: string, fetcher?: Fetcher) => api.get<Property>(`/properties/${id}`, undefined, f(fetcher)),

	similar: (id: string, limit = 6, fetcher?: Fetcher) =>
		api.get<Paged<Property>>(`/properties/${id}/similar`, { limit }, f(fetcher)),

	mine: () => api.get<Paged<Property>>('/properties/mine', undefined, { auth: true }),

	create: (body: Record<string, unknown>) =>
		api.post<Property>('/properties', body, { auth: true }),

	trackView: (id: string) => api.post(`/properties/${id}/view`, undefined).catch(() => {})
};

/* ── Projects (new launches) ─────────────────────────────────────── */
export const Projects = {
	list: (city?: string, fetcher?: Fetcher) =>
		api.get<Paged<Project>>('/catalog/projects', city ? { city } : undefined, f(fetcher)),
	get: (id: string, fetcher?: Fetcher) =>
		api.get<Project>(`/catalog/projects/${id}`, undefined, f(fetcher))
};

/* ── Platform CMS data ───────────────────────────────────────────── */
export const Platform = {
	all: (fetcher?: Fetcher) => api.get<Record<string, unknown>>('/platform-data', undefined, f(fetcher)),
	key: <T>(key: string, fetcher?: Fetcher) =>
		api.get<T>(`/platform-data/${key}`, undefined, f(fetcher))
};

/* ── Auth ────────────────────────────────────────────────────────── */
export const Auth = {
	login: (email: string, password: string) =>
		api.post<AuthResponse>('/auth/login', { email, password }),
	register: (body: { email: string; password: string; name: string; role?: string; phone?: string }) =>
		api.post<AuthResponse>('/auth/register', body),
	me: () => api.get<Me>('/auth/me', undefined, { auth: true }),
	updateMe: (body: { name?: string; phone?: string; avatar_url?: string; email?: string }) =>
		api.patch<Me>('/auth/me', body, { auth: true }),
	logout: () => api.post('/auth/logout', undefined, { auth: true }).catch(() => {})
};

/* ── Engagement: favorites & recently viewed ─────────────────────── */
export const Favorites = {
	list: () => api.get<Paged<Property>>('/favorites', undefined, { auth: true }),
	add: (propertyId: string) => api.post('/favorites', { propertyId }, { auth: true }),
	remove: (propertyId: string) => api.del(`/favorites/${propertyId}`, undefined, { auth: true })
};

/* ── Leads & requests ────────────────────────────────────────────── */
export const Leads = {
	/** Backend derives the recipient from the property's owner/broker. */
	inquiry: (body: { propertyId: string; message: string }) =>
		api.post('/inquiries', body, { auth: true }),
	siteVisit: (body: {
		propertyId: string;
		preferredDate: string;
		slot?: string;
		name: string;
		phone: string;
		notes?: string;
	}) => api.post('/catalog/site-visits', body, { auth: true }),
	homeLoan: (body: {
		name: string;
		phone: string;
		email?: string;
		city?: string;
		loanAmount?: number;
		partner?: string;
	}) => api.post('/catalog/home-loan-leads', body)
};
