<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { ApiError } from '$lib/api/client';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils/cn';
	import User from '@lucide/svelte/icons/user';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';
	import Phone from '@lucide/svelte/icons/phone';

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let password = $state('');
	let role = $state<'buyer' | 'owner' | 'broker'>('buyer');
	let loading = $state(false);
	let error = $state('');

	const roles = [
		{ v: 'buyer', l: 'Buyer / Tenant' },
		{ v: 'owner', l: 'Owner' },
		{ v: 'broker', l: 'Broker' }
	] as const;

	async function submit() {
		error = '';
		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}
		loading = true;
		try {
			await auth.register({ name: name.trim(), email: email.trim(), password, role, phone: phone.trim() || undefined });
			goto('/dashboard');
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Could not create account. Try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Create account — NxtGenProperties</title></svelte:head>

<AuthShell title="Create your account" subtitle="Join free to save homes, list properties and chat with owners.">
	<form onsubmit={(e) => { e.preventDefault(); submit(); }} class="space-y-4">
		{#if error}
			<p class="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>
		{/if}

		<div>
			<span class="mb-1.5 block text-sm font-semibold text-navy">I am a</span>
			<div class="flex gap-2">
				{#each roles as r (r.v)}
					<button
						type="button"
						class={cn('h-10 flex-1 rounded-xl border text-sm font-semibold transition', role === r.v ? 'border-primary bg-primary-container text-primary' : 'border-outline-soft text-ink-soft hover:border-primary')}
						onclick={() => (role = r.v)}
					>{r.l}</button>
				{/each}
			</div>
		</div>

		<div class="relative">
			<User class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
			<Input bind:value={name} placeholder="Full name" required class="pl-11" />
		</div>
		<div class="relative">
			<Mail class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
			<Input bind:value={email} type="email" placeholder="Email address" required class="pl-11" />
		</div>
		<div class="relative">
			<Phone class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
			<Input bind:value={phone} type="tel" placeholder="Phone (optional)" class="pl-11" />
		</div>
		<div class="relative">
			<Lock class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
			<Input bind:value={password} type="password" placeholder="Password (min 8 chars)" required class="pl-11" />
		</div>

		<Button type="submit" class="w-full" size="lg" {loading}>Create account</Button>
	</form>

	<p class="mt-6 text-center text-sm text-ink-soft">
		Already have an account? <a href="/login" class="font-semibold text-primary hover:underline">Sign in</a>
	</p>
</AuthShell>
