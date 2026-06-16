<script lang="ts">
  import { enhance } from '$app/forms';
  import ThreeHero from '$lib/components/ThreeHero.svelte';
  import { Shield, Eye, EyeOff, Loader2 } from 'lucide-svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  let showPw = $state(false);
  let submitting = $state(false);
</script>

<div class="relative grid min-h-screen place-items-center overflow-hidden p-6">
  <div class="pointer-events-none absolute inset-0 -z-10 opacity-70">
    <ThreeHero />
  </div>
  <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/40 via-ink/70 to-ink"></div>

  <div class="w-full max-w-md">
    <div class="mb-6 flex items-center gap-2">
      <div class="grid h-10 w-10 place-items-center rounded-xl bg-primary">
        <Shield size={20} color="#fff" />
      </div>
      <div>
        <div class="text-lg font-extrabold text-white">NxtGen Admin</div>
        <div class="text-xs text-gold">Control panel</div>
      </div>
    </div>

    <div class="card p-6">
      <h1 class="mb-1 text-xl font-bold text-white">Welcome back</h1>
      <p class="mb-5 text-sm text-slate-400">Sign in with your administrator account.</p>

      {#if form?.error}
        <div class="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        action="?/login"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update();
            submitting = false;
          };
        }}
        class="space-y-4"
      >
        <div>
          <label for="email" class="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
          <input id="email" name="email" type="email" value={form?.email ?? ''} required class="input" placeholder="admin@nxtgenproperties.com" />
        </div>
        <div>
          <label for="password" class="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
          <div class="relative">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              required
              class="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onclick={() => (showPw = !showPw)}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Toggle password"
            >
              {#if showPw}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
            </button>
          </div>
        </div>
        <button type="submit" disabled={submitting} class="btn-primary w-full">
          {#if submitting}<Loader2 size={18} class="animate-spin" />{/if}
          Sign in
        </button>
      </form>
    </div>
    <p class="mt-4 text-center text-xs text-slate-600">Authorized personnel only · activity is logged</p>
  </div>
</div>
