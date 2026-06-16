<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { Properties } from '$lib/api/endpoints';
	import type { Property } from '$lib/api/types';
	import { formatPrice, initials, titleCase } from '$lib/utils/format';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Heart from '@lucide/svelte/icons/heart';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Plus from '@lucide/svelte/icons/plus';

	let listings = $state<Property[]>([]);
	let loading = $state(true);

	// Redirect out once we know the user is signed-out.
	$effect(() => {
		if (!auth.loading && !auth.signedIn) goto('/login?redirect=/dashboard');
	});

	$effect(() => {
		if (auth.signedIn) {
			loading = true;
			Properties.mine()
				.then((r) => (listings = r.items))
				.catch(() => (listings = []))
				.finally(() => (loading = false));
		}
	});

	async function logout() {
		await auth.logout();
		goto('/');
	}

	const stats = $derived([
		{ icon: Building2, label: 'Active listings', value: listings.length },
		{ icon: Eye, label: 'Verified', value: listings.filter((l) => l.verified).length },
		{ icon: Heart, label: 'Featured', value: listings.filter((l) => l.featured).length }
	]);
</script>

<svelte:head><title>Dashboard — NxtGenProperties</title></svelte:head>

<section class="container-px pt-28">
	{#if auth.signedIn}
		<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-soft/60 bg-card p-6">
			<div class="flex items-center gap-4">
				{#if auth.user?.profile?.avatarUrl}
					<img src={auth.user.profile.avatarUrl} alt={auth.name} class="size-14 rounded-full object-cover" />
				{:else}
					<span class="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-white">{initials(auth.name)}</span>
				{/if}
				<div>
					<h1 class="font-display text-2xl font-extrabold text-navy">{auth.name ?? 'Welcome'}</h1>
					<p class="text-sm text-ink-soft">
						{auth.user?.email}
						{#if auth.role}<Badge tone="teal" class="ml-2 capitalize">{auth.role}</Badge>{/if}
					</p>
				</div>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={logout}><LogOut class="size-4" /> Sign out</Button>
			</div>
		</div>

		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			{#each stats as s (s.label)}
				{@const Icon = s.icon}
				<div class="flex items-center gap-4 rounded-2xl border border-outline-soft/60 bg-surface p-5">
					<span class="grid size-12 place-items-center rounded-xl bg-primary-container text-primary"><Icon class="size-6" /></span>
					<div>
						<p class="font-display text-2xl font-extrabold text-navy">{s.value}</p>
						<p class="text-sm text-ink-soft">{s.label}</p>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-10 flex items-center justify-between">
			<h2 class="font-display text-xl font-bold text-navy">My listings</h2>
			<Button href="/properties" variant="ghost" size="sm"><Plus class="size-4" /> Post a property</Button>
		</div>

		{#if loading}
			<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _, i (i)}
					<div class="space-y-3"><Skeleton class="aspect-4/3" /><Skeleton class="h-5 w-3/4" /></div>
				{/each}
			</div>
		{:else if listings.length}
			<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each listings as property (property.id)}
					<PropertyCard {property} />
				{/each}
			</div>
		{:else}
			<div class="mt-6 grid place-items-center gap-3 rounded-3xl border border-dashed border-outline-soft bg-card py-20 text-center">
				<Building2 class="size-10 text-ink-soft/50" />
				<p class="font-display text-lg font-bold text-navy">You haven't posted any properties yet</p>
				<p class="max-w-sm text-sm text-ink-soft">Posting is available in the NxtGenProperties mobile app and admin panel.</p>
				<Button href="/properties" variant="outline" size="sm" class="mt-2">Browse listings</Button>
			</div>
		{/if}
	{:else}
		<div class="py-32 text-center text-ink-soft">Redirecting to sign in…</div>
	{/if}
</section>
