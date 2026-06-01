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

/** Map the backend me/profile payload to the app's flat `User` shape. */
export function toUser(me: MeResponse): User | null {
  if (!me.profile) return null;
  return {
    id: me.profile.id,
    user_id: me.profile.user_id,
    name: me.profile.name ?? 'User',
    role: me.profile.role as User['role'],
    avatar_url: me.profile.avatar_url ?? undefined,
    rating: me.profile.rating ? Number(me.profile.rating) : undefined,
    verified_broker: me.profile.verified_broker ?? undefined,
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
