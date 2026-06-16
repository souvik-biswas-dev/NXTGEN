<script lang="ts">
	import { formatPrice, formatArea } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Building2 from '@lucide/svelte/icons/building-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Check from '@lucide/svelte/icons/check';
	import Layers from '@lucide/svelte/icons/layers';
	import Home from '@lucide/svelte/icons/home';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();
	const pr = $derived(data.project);
	let activePhoto = $state(0);
	const gallery = $derived(pr.gallery?.length ? pr.gallery : pr.coverImage ? [pr.coverImage] : []);

	const facts = $derived(
		[
			pr.totalUnits ? { icon: Home, label: 'Total units', value: String(pr.totalUnits) } : null,
			pr.availableUnits ? { icon: Home, label: 'Available', value: String(pr.availableUnits) } : null,
			pr.towerCount ? { icon: Layers, label: 'Towers', value: String(pr.towerCount) } : null,
			pr.possessionDate ? { icon: CalendarClock, label: 'Possession', value: pr.possessionDate } : null,
			pr.launchDate ? { icon: CalendarClock, label: 'Launch', value: pr.launchDate } : null
		].filter(Boolean) as { icon: typeof Home; label: string; value: string }[]
	);
</script>

<svelte:head>
	<title>{pr.name} by {pr.developer} — NxtGenProperties</title>
</svelte:head>

<div class="container-px pt-28">
	<nav class="flex items-center gap-1.5 text-sm text-ink-soft">
		<a href="/" class="hover:text-primary">Home</a>
		<ChevronRight class="size-3.5" />
		<a href="/projects" class="hover:text-primary">New Launches</a>
		<ChevronRight class="size-3.5" />
		<span class="text-ink">{pr.name}</span>
	</nav>
</div>

<!-- Gallery -->
<section class="container-px mt-5">
	<div class="relative aspect-21/9 overflow-hidden rounded-2xl bg-card">
		{#if gallery.length}
			<img src={gallery[activePhoto]} alt={pr.name} class="size-full object-cover" />
		{:else}
			<div class="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-gold/15">
				<Building2 class="size-14 text-primary/40" />
			</div>
		{/if}
		<div class="absolute left-4 top-4 flex gap-2">
			{#if pr.featured}<Badge tone="gold">★ Featured</Badge>{/if}
			{#if pr.reraId}<Badge tone="success"><ShieldCheck class="size-3.5" /> RERA {pr.reraId}</Badge>{/if}
		</div>
	</div>
	{#if gallery.length > 1}
		<div class="mt-3 flex gap-3 overflow-x-auto pb-1">
			{#each gallery as photo, i (photo)}
				<button
					class="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl ring-2 transition {activePhoto === i ? 'ring-primary' : 'ring-transparent'}"
					onclick={() => (activePhoto = i)}
				>
					<img src={photo} alt={`View ${i + 1}`} class="size-full object-cover" />
				</button>
			{/each}
		</div>
	{/if}
</section>

<section class="container-px mt-8 grid gap-10 pb-10 lg:grid-cols-[1.7fr_1fr]">
	<div>
		<p class="text-sm font-semibold uppercase tracking-wide text-primary">{pr.developer}</p>
		<h1 class="mt-1 font-display text-3xl font-extrabold text-navy">{pr.name}</h1>
		<p class="mt-2 flex items-center gap-1.5 text-ink-soft">
			<MapPin class="size-4 text-primary" />{pr.location}
		</p>

		{#if facts.length}
			<div class="mt-7 grid grid-cols-2 gap-4 rounded-2xl border border-outline-soft/60 bg-card p-5 sm:grid-cols-3">
				{#each facts as f (f.label)}
					{@const Icon = f.icon}
					<div class="flex items-center gap-3">
						<span class="grid size-10 place-items-center rounded-xl bg-surface text-primary"><Icon class="size-5" /></span>
						<div>
							<p class="text-xs text-ink-soft">{f.label}</p>
							<p class="font-display font-bold text-navy">{f.value}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if pr.description}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">About the project</h2>
				<p class="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{pr.description}</p>
			</div>
		{/if}

		{#if pr.floorPlans?.length}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">Floor plans</h2>
				<div class="mt-4 overflow-hidden rounded-2xl border border-outline-soft/60">
					<table class="w-full text-sm">
						<thead class="bg-card text-left text-xs uppercase tracking-wide text-ink-soft">
							<tr>
								<th class="px-5 py-3 font-semibold">Configuration</th>
								<th class="px-5 py-3 font-semibold">Area</th>
								<th class="px-5 py-3 font-semibold">Starting price</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-outline-soft/60">
							{#each pr.floorPlans as plan (plan.name)}
								<tr>
									<td class="px-5 py-3 font-semibold text-navy">{plan.name}</td>
									<td class="px-5 py-3 text-ink-soft">{plan.area ? formatArea(plan.area) : '—'}</td>
									<td class="px-5 py-3 font-semibold text-primary">{plan.price ? formatPrice(plan.price) : 'On request'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if pr.amenities?.length}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">Amenities</h2>
				<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each pr.amenities as a (a)}
						<div class="flex items-center gap-2 rounded-xl border border-outline-soft/60 bg-surface px-4 py-3 text-sm text-ink">
							<span class="grid size-6 place-items-center rounded-full bg-primary-container text-primary"><Check class="size-3.5" /></span>
							{a}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<aside class="lg:sticky lg:top-24 lg:self-start">
		<div class="rounded-2xl border border-outline-soft/60 bg-surface p-6 shadow-sm">
			<p class="text-sm text-ink-soft">Price range</p>
			<p class="mt-1 font-display text-3xl font-extrabold text-primary">
				{#if pr.priceMin}{formatPrice(pr.priceMin)}{#if pr.priceMax} – {formatPrice(pr.priceMax)}{/if}{:else}On request{/if}
			</p>
			<div class="mt-5 space-y-2.5">
				<Button class="w-full" href={`/properties?city=${encodeURIComponent(pr.city)}`}>
					Explore homes in {pr.city}
				</Button>
				<Button variant="outline" class="w-full" href="/tools/emi">Calculate EMI</Button>
			</div>
			<p class="mt-4 text-center text-xs text-ink-soft">
				{#if pr.reraId}RERA ID: {pr.reraId}{:else}Verified developer listing{/if}
			</p>
		</div>
	</aside>
</section>
