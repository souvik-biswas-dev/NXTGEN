// Shared Hono context typing. `user` is set by the auth middleware.
export interface AuthUser {
  id: string;
  role: string; // 'buyer' | 'owner' | 'broker' | 'admin'
}

export type AppEnv = {
  Variables: {
    user: AuthUser | null;
  };
};
