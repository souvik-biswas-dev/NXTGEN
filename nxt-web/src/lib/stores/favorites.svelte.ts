import { browser } from '$app/environment';
import { Favorites } from '$lib/api/endpoints';
import { hasSession } from '$lib/api/client';
import type { Property } from '$lib/api/types';

const GUEST_KEY = 'ngp.guestFavorites';

/**
 * Favorites store. Signed-in users sync to the backend; guests keep IDs in
 * localStorage so the heart toggle still works before they log in.
 */
class FavoritesStore {
	ids = $state<Set<string>>(new Set());
	items = $state<Property[]>([]);

	async init() {
		if (!browser) return;
		if (hasSession()) {
			try {
				const res = await Favorites.list();
				this.items = res.items;
				this.ids = new Set(res.items.map((p) => p.id));
				return;
			} catch {
				/* fall through to guest */
			}
		}
		this.ids = new Set(this.readGuest());
	}

	has(id: string) {
		return this.ids.has(id);
	}

	async toggle(id: string) {
		const next = new Set(this.ids);
		const adding = !next.has(id);
		adding ? next.add(id) : next.delete(id);
		this.ids = next;

		if (hasSession()) {
			try {
				adding ? await Favorites.add(id) : await Favorites.remove(id);
			} catch {
				/* revert on failure */
				const revert = new Set(this.ids);
				adding ? revert.delete(id) : revert.add(id);
				this.ids = revert;
			}
		} else {
			this.writeGuest([...next]);
		}
	}

	private readGuest(): string[] {
		try {
			return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]');
		} catch {
			return [];
		}
	}
	private writeGuest(ids: string[]) {
		localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
	}
}

export const favorites = new FavoritesStore();
