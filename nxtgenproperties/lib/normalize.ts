// ── camelCase → snake_case normalization ─────────────────────────
// The Hono/Drizzle backend returns property + profile rows with their raw
// camelCase column property names (`areaSqft`, `ownerId`, `avatarUrl`,
// `createdAt`, …). This app's types and ~45 screens are uniformly snake_case
// (`area_sqft`, `owner_id`, `avatar_url`, …). Without normalization, every
// multi-word field is `undefined` — which is what produced the "undefined sqft"
// and "₹NaN/sqft" labels on the cards and detail screen.
//
// We snake_case-convert ONLY the property-shaped responses (see api.ts), never
// arbitrary blobs like platform_data (`home_loan_partners` etc.) which
// intentionally hold camelCase content.

function snakeKey(key: string): string {
  // areaSqft → area_sqft, superBuiltUp → super_built_up, verifiedBroker → verified_broker
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function camelToSnakeDeep<T = unknown>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => camelToSnakeDeep(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeKey(k)] = camelToSnakeDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}

// Normalize a property-endpoint response while leaving the list envelope keys
// (`items`, `markers`, `hasMore`) untouched so callers that read `.hasMore`
// keep working — only the row objects inside get key-normalized.
export function normalizePropertyResponse<T>(data: T): T {
  if (data === null || typeof data !== 'object') return data;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    return { ...obj, items: obj.items.map((it) => camelToSnakeDeep(it)) } as unknown as T;
  }
  if (Array.isArray(obj.markers)) {
    return { ...obj, markers: obj.markers.map((it) => camelToSnakeDeep(it)) } as unknown as T;
  }
  if (Array.isArray(data)) {
    return (data as unknown[]).map((it) => camelToSnakeDeep(it)) as unknown as T;
  }
  // A single property (detail) object.
  return camelToSnakeDeep(data);
}
