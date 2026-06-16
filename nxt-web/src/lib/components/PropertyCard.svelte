<script lang="ts">
	import type { Property } from '$lib/api/types';
	import { formatPrice, formatArea, titleCase, prettyBhk } from '$lib/utils/format';
	import { favorites } from '$lib/stores/favorites.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import BedDouble from '@lucide/svelte/icons/bed-double';
	import Bath from '@lucide/svelte/icons/bath';
	import Maximize from '@lucide/svelte/icons/maximize';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';

	let { property, eager = false }: { property: Property; eager?: boolean } = $props();

	const photo = $derived(property.photos?.[0] ?? null);
	const area = $derived(property.areaSqft ?? 0);
	const isFav = $derived(favorites.has(property.id));

	function toggleFav(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		favorites.toggle(property.id);
	}
</script>

<a
	href={`/properties/${property.id}`}
	class="card-elevate group block overflow-hidden rounded-2xl border border-outline-soft/60 bg-surface"
>
	<div class="relative aspect-4/3 overflow-hidden bg-card">
		{#if photo}
			<img
				src={photo}
				alt={property.title}
				loading={eager ? 'eager' : 'lazy'}
				class="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
			/>
		{:else}
			<div class="grid size-full place-items-center bg-linear-to-br from-primary/15 via-card to-gold/15">
				<span class="font-display text-lg font-bold text-primary/50">NxtGen</span>
			</div>
		{/if}

		<div class="absolute inset-x-0 top-0 flex items-start justify-between p-3">
			<div class="flex flex-wrap gap-1.5">
				<Badge tone="navy">{property.type === 'rent' ? 'For Rent' : 'For Sale'}</Badge>
				{#if property.featured}<Badge tone="gold">★ Featured</Badge>{/if}
			</div>
			<button
				onclick={toggleFav}
				class="grid size-9 shrink-0 place-items-center rounded-full bg-white/90 text-navy shadow-sm backdrop-blur transition hover:scale-110"
				aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
			>
				<Heart class="size-4.5 transition-colors {isFav ? 'fill-error text-error' : ''}" />
			</button>
		</div>

		<div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/80 to-transparent p-3 pt-10">
			<p class="font-display text-xl font-extrabold text-white">
				{formatPrice(property.price)}
				{#if property.type === 'rent'}<span class="text-sm font-medium text-white/70">/mo</span>{/if}
			</p>
		</div>
	</div>

	<div class="p-4">
		<div class="flex items-start justify-between gap-2">
			<h3 class="line-clamp-1 font-display text-base font-bold text-navy">{property.title}</h3>
			{#if property.verified}
				<BadgeCheck class="size-5 shrink-0 text-primary" />
			{/if}
		</div>
		<p class="mt-1 flex items-center gap-1 text-sm text-ink-soft">
			<MapPin class="size-3.5 shrink-0 text-primary" />
			<span class="line-clamp-1">{property.locality}, {property.city}</span>
		</p>

		<div class="mt-3 flex items-center gap-4 border-t border-outline-soft/60 pt-3 text-sm text-ink-soft">
			<span class="flex items-center gap-1.5" title="Bedrooms">
				<BedDouble class="size-4 text-primary" />{prettyBhk(property.bhk) || `${property.bedrooms} Bed`}
			</span>
			<span class="flex items-center gap-1.5" title="Bathrooms">
				<Bath class="size-4 text-primary" />{property.bathrooms}
			</span>
			<span class="ml-auto flex items-center gap-1.5" title="Area">
				<Maximize class="size-4 text-primary" />{formatArea(area)}
			</span>
		</div>

		{#if property.furnishing}
			<p class="mt-2 text-xs text-ink-soft/70">
				{titleCase(property.furnishing)} · {titleCase(property.possession)}
			</p>
		{/if}
	</div>
</a>
