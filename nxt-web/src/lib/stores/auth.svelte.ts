import { browser } from '$app/environment';
import { Auth } from '$lib/api/endpoints';
import { clearTokens, hasSession, setTokens } from '$lib/api/client';
import type { Me } from '$lib/api/types';

class AuthStore {
	user = $state<Me | null>(null);
	loading = $state(true);
	get signedIn() {
		return !!this.user;
	}
	get name() {
		return this.user?.profile?.name ?? null;
	}
	get role() {
		return this.user?.profile?.role ?? null;
	}

	/** Hydrate from stored tokens on first client load. */
	async init() {
		if (!browser) {
			this.loading = false;
			return;
		}
		if (!hasSession()) {
			this.loading = false;
			return;
		}
		try {
			this.user = await Auth.me();
		} catch {
			clearTokens();
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async login(email: string, password: string) {
		const res = await Auth.login(email, password);
		setTokens(res.accessToken, res.refreshToken);
		this.user = res.user;
		return res.user;
	}

	async register(body: { email: string; password: string; name: string; role?: string; phone?: string }) {
		const res = await Auth.register(body);
		setTokens(res.accessToken, res.refreshToken);
		this.user = res.user;
		return res.user;
	}

	async logout() {
		await Auth.logout();
		clearTokens();
		this.user = null;
	}
}

export const auth = new AuthStore();
