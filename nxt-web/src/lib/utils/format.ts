/** Indian-market formatting helpers (₹, Lakh / Crore, areas, dates). */

/** Compact price: 4500000 → "₹45 L", 12500000 → "₹1.25 Cr". */
export function formatPrice(value?: number | null): string {
	if (value == null || Number.isNaN(value)) return '—';
	if (value >= 1_00_00_000) {
		const cr = value / 1_00_00_000;
		return `₹${trim(cr)} Cr`;
	}
	if (value >= 1_00_000) {
		const l = value / 1_00_000;
		return `₹${trim(l)} L`;
	}
	if (value >= 1_000) {
		const k = value / 1_000;
		return `₹${trim(k)} K`;
	}
	return `₹${value}`;
}

/** Full grouped rupees: 4500000 → "₹45,00,000". */
export function formatRupees(value?: number | null): string {
	if (value == null || Number.isNaN(value)) return '—';
	return `₹${value.toLocaleString('en-IN')}`;
}

function trim(n: number): string {
	return n
		.toFixed(2)
		.replace(/\.0+$/, '')
		.replace(/(\.\d)0$/, '$1');
}

export function formatArea(sqft?: number | null): string {
	if (sqft == null) return '—';
	return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

/** "2 days ago", "3 weeks ago", … */
export function timeAgo(input?: string | Date | null): string {
	if (!input) return '';
	const date = typeof input === 'string' ? new Date(input) : input;
	const secs = Math.round((Date.now() - date.getTime()) / 1000);
	const table: [number, string][] = [
		[60, 'second'],
		[60, 'minute'],
		[24, 'hour'],
		[7, 'day'],
		[4.345, 'week'],
		[12, 'month'],
		[Number.POSITIVE_INFINITY, 'year']
	];
	let unit = secs;
	let i = 0;
	for (; i < table.length && unit >= table[i][0]; i++) unit /= table[i][0];
	const rounded = Math.floor(unit);
	if (i === 0) return 'just now';
	const label = table[i - 1][1];
	return `${rounded} ${label}${rounded === 1 ? '' : 's'} ago`;
}

/** "2BHK" → "2 BHK", "5+BHK" → "5+ BHK", "1RK" → "1 RK". */
export function prettyBhk(bhk?: string | null): string {
	if (!bhk) return '';
	return bhk.replace(/(BHK|RK)/i, ' $1').replace(/\s+/g, ' ').trim();
}

export function titleCase(s?: string | null): string {
	if (!s) return '';
	return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Initials for avatar fallbacks. */
export function initials(name?: string | null): string {
	if (!name) return 'NG';
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
}
