<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { ApiError } from '$lib/api/client';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	const redirect = $derived(page.url.searchParams.get('redirect') || '/dashboard');

	async function submit() {
		error = '';
		loading = true;
		try {
			await auth.login(email.trim(), password);
			goto(redirect);
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Something went wrong. Try again.';
		} finally {
			loading = false;
		}
	}

	function demo(role: 'owner' | 'broker') {
		email = `${role}1@example.com`;
		password = 'Password123!';
	}
</script>

<svelte:head><title>Sign in — NxtGenProperties</title></svelte:head>

<AuthShell title="Welcome back" subtitle="Sign in to manage listings, favorites and inquiries.">
	<form onsubmit={(e) => { e.preventDefault(); submit(); }} class="space-y-4">
		{#if error}
			<p class="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>
		{/if}

		<label class="block">
			<span class="mb-1.5 block text-sm font-semibold text-navy">Email</span>
			<div class="relative">
				<Mail class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
				<Input bind:value={email} type="email" placeholder="you@email.com" required class="pl-11" />
			</div>
		</label>

		<label class="block">
			<span class="mb-1.5 block text-sm font-semibold text-navy">Password</span>
			<div class="relative">
				<Lock class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
				<Input bind:value={password} type="password" placeholder="••••••••" required class="pl-11" />
			</div>
		</label>

		<Button type="submit" class="w-full" size="lg" {loading}>Sign in</Button>
	</form>

	<div class="mt-5 rounded-xl border border-dashed border-outline-soft bg-card p-4 text-sm">
		<p class="font-semibold text-navy">Demo accounts</p>
		<p class="mt-1 text-ink-soft">Password: <code class="rounded bg-surface px-1.5 py-0.5 text-xs">Password123!</code></p>
		<div class="mt-2 flex gap-2">
			<button class="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary" onclick={() => demo('owner')}>Owner</button>
			<button class="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary" onclick={() => demo('broker')}>Broker</button>
		</div>
	</div>

	<p class="mt-6 text-center text-sm text-ink-soft">
		New to NxtGen? <a href="/register" class="font-semibold text-primary hover:underline">Create an account</a>
	</p>
</AuthShell>
