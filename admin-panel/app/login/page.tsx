'use client';

import { Suspense, useActionState, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Shield, Eye, EyeOff } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRecovery = searchParams.get('type') === 'recovery' && searchParams.get('token');

  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    setResetError('');

    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match');
      setResetting(false);
      return;
    }

    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      setResetting(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: resetPassword });

      if (error) throw error;

      setResetSuccess(true);
      setResetPassword('');
      setResetConfirm('');
      redirectTimerRef.current = setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-[#FF6B35]" />
        <h2 className="text-lg font-semibold text-white">
          {isRecovery ? 'Set Your Password' : 'Secure Admin Login'}
        </h2>
      </div>

      {isRecovery ? (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm" className="text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>

          {resetError && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2.5">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{resetError}</p>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-lg px-3 py-2.5">
              <Shield className="w-4 h-4 text-green-400 shrink-0" />
              <p className="text-green-400 text-sm">Password set successfully! Redirecting...</p>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" loading={resetting} size="lg">
            Set Password & Login
          </Button>
        </form>
      ) : (
        <form action={action} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="admin@nxtgenproperties.com"
            required
            autoComplete="email"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2.5">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{state.error}</p>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" loading={pending} size="lg">
            Sign In to Admin Panel
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-gray-600 mt-6">
        Protected by JWT session authentication
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-linear-to-br from-[#FF6B35]/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B35] flex items-center justify-center mb-4 shadow-lg shadow-[#FF6B35]/30">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NxtGenProperties</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Portal</p>
        </div>

        <Suspense fallback={
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-700 mt-4">
          NxtGenProperties {new Date().getFullYear()} · Admin Portal v1.0
        </p>
      </div>
    </div>
  );
}
