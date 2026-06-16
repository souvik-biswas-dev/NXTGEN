<script lang="ts">
	import { favorites } from '$lib/stores/favorites.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { Properties } from '$lib/api/endpoints';
	import { hasSession } from '$lib/api/client';
	import type { Property } from '$lib/api/types';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import HeartCrack from '@lucide/svelte/icons/heart-crack';

	let guestItems = $state<Property[]>([]);
	let loading = $state(true);

	// For signed-in users the store holds full items; guests only have IDs in
	// localStorage, so hydrate those by fetching each property.
	$effect(() => {
		const ids = [...favorites.ids];
		if (hasSession()) {
			loading = favorites.items.length === 0 && ids.length > 0;
			return;
		}
		loading = true;
		Promise.all(ids.map((id) => Properties.get(id).catch(() => null)))
			.then((rows) => (guestItems = rows.filter(Boolean) as Property[]))
			.finally(() => (loading = false));
	});

	const items = $derived(hasSession() ? favorites.items.filter((p) => favorites.has(p.id)) : guestItems.filter((p) => favorites.has(p.id)));
</script>

<svelte:head><title>Saved properties — NxtGenProperties</title></svelte:head>

<section class="container-px pt-28">
	<h1 class="font-display text-3xl font-extrabold text-navy">Saved properties</h1>
	<p class="mt-2 text-ink-soft">
		{favorites.ids.size} propert{favorites.ids.size === 1 ? 'y' : 'ies'} you're keeping an eye on.
		{#if !auth.signedIn && favorites.ids.size}
			<a href="/login?redirect=/favorites" class="font-semibold text-primary hover:underline">Sign in</a> to sync across devices.
		{/if}
	</p>
</section>

<section class="container-px py-10">
	{#if loading}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(4) as _, i (i)}
				<div class="space-y-3">
					<Skeleton class="aspect-4/3" />
					<Skeleton class="h-5 w-3/4" />
					<Skeleton class="h-4 w-1/2" />
				</div>
			{/each}
		</div>
	{:else if items.length}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each items as property (property.id)}
				<PropertyCard {property} />
			{/each}
		</div>
	{:else}
		<div class="grid place-items-center gap-3 rounded-3xl border border-dashed border-outline-soft bg-card py-24 text-center">
			<HeartCrack class="size-12 text-ink-soft/50" />
			<p class="font-display text-xl font-bold text-navy">No saved properties yet</p>
			<p class="max-w-sm text-sm text-ink-soft">Tap the heart on any listing to save it here for later.</p>
			<Button href="/properties" class="mt-2">Explore properties</Button>
		</div>
	{/if}
</section>
