import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { propertyAlerts } from '@/db/schema';
import { notify } from './notify';
import type { properties } from '@/db/schema';

type Property = typeof properties.$inferSelect;

interface AlertFilters {
  city?: string;
  locality?: string;
  type?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bhk?: string[];
  furnishing?: string[];
  facing?: string[];
  possession?: string;
}

/** Does a newly-posted property satisfy a saved-search's filters? */
function matches(p: Property, f: AlertFilters): boolean {
  const ci = (a?: string, b?: string) => !a || (b ?? '').toLowerCase().includes(a.toLowerCase());
  if (!ci(f.city, p.city)) return false;
  if (!ci(f.locality, p.locality)) return false;
  if (f.type && p.type !== f.type) return false;
  if (f.category && p.category !== f.category) return false;
  if (f.possession && p.possession !== f.possession) return false;
  if (f.minPrice !== undefined && p.price < f.minPrice) return false;
  if (f.maxPrice !== undefined && p.price > f.maxPrice) return false;
  if (f.minArea !== undefined && p.areaSqft < f.minArea) return false;
  if (f.maxArea !== undefined && p.areaSqft > f.maxArea) return false;
  if (f.bhk?.length && !f.bhk.includes(p.bhk)) return false;
  if (f.furnishing?.length && !f.furnishing.includes(p.furnishing)) return false;
  if (f.facing?.length && p.facing && !f.facing.includes(p.facing)) return false;
  return true;
}

/**
 * Fan a new listing out to every active saved-search it matches.
 * Sends an in-app notification + Expo push to the alert owner.
 * Fire-and-forget from the property-create route.
 */
export async function matchAlertsForProperty(property: Property): Promise<void> {
  try {
    const active = await db.select().from(propertyAlerts).where(eq(propertyAlerts.active, true));
    const now = new Date();
    for (const alert of active) {
      // Don't notify the owner about their own listing.
      if (alert.userId === property.ownerId || alert.userId === property.brokerId) continue;
      if (!matches(property, (alert.filters ?? {}) as AlertFilters)) continue;

      await notify({
        userId: alert.userId,
        type: 'match',
        title: `New match: ${alert.name}`,
        body: `${property.title} — ${property.locality}, ${property.city}`,
        data: { propertyId: property.id, alertId: alert.id },
      });
      await db
        .update(propertyAlerts)
        .set({ lastNotifiedAt: now })
        .where(eq(propertyAlerts.id, alert.id));
    }
  } catch (e) {
    console.warn('[alerts] match failed', e);
  }
}
