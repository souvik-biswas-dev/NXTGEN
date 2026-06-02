import { api, setTokens, clearTokens } from '@/lib/api';
import { User } from '@/types';

// Shape returned by the backend's getMe().
export interface MeResponse {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: {
    id: string;
    user_id: string;
    name: string | null;
    role: string;
    avatar_url: string | null;
    rating: string | null;
    verified_broker: boolean | null;
  } | null;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: MeResponse;
}

/** Map the backend me/profile payload to the app's flat `User` shape.
 *  The backend serializes `profile` as the raw Drizzle row (camelCase:
 *  `userId`, `avatarUrl`, `verifiedBroker`), so read both casings — otherwise
 *  `user_id` is undefined and avatar/upload actions wrongly think you're signed
 *  out. */
export function toUser(me: MeResponse): User | null {
  if (!me.profile) return null;
  const p = me.profile as MeResponse['profile'] & {
    userId?: string;
    avatarUrl?: string | null;
    verifiedBroker?: boolean | null;
  };
  return {
    id: p.id,
    user_id: p.user_id ?? p.userId,
    name: p.name ?? 'User',
    role: p.role as User['role'],
    avatar_url: p.avatar_url ?? p.avatarUrl ?? undefined,
    rating: p.rating ? Number(p.rating) : undefined,
    verified_broker: p.verified_broker ?? p.verifiedBroker ?? undefined,
    email: me.email ?? undefined,
    phone: me.phone ?? undefined,
    created_at: '',
  } as User;
}

async function persist(res: AuthResponse): Promise<User | null> {
  await setTokens(res.accessToken, res.refreshToken);
  return toUser(res.user);
}

export const auth = {
  register: async (input: {
    email: string;
    password: string;
    name: string;
    role?: 'buyer' | 'owner' | 'broker';
    phone?: string;
  }) => persist(await api.post<AuthResponse>('/auth/register', input, false)),

  login: async (email: string, password: string) =>
    persist(await api.post<AuthResponse>('/auth/login', { email, password }, false)),

  requestOtp: (phone: string) => api.post<{ ok: true }>('/auth/otp/request', { phone }, false),

  verifyOtp: async (input: { phone: string; code: string; name?: string; role?: string }) =>
    persist(await api.post<AuthResponse>('/auth/otp/verify', input, false)),

  google: async (idToken: string, role?: string) =>
    persist(await api.post<AuthResponse>('/auth/google', { idToken, role }, false)),

  me: () => api.get<MeResponse>('/auth/me'),

  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'email' | 'avatar_url'>>) =>
    api.patch<MeResponse>('/auth/me', patch),

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    await clearTokens();
  },
};
