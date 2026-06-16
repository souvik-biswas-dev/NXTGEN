<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Properties, Leads } from '$lib/api/endpoints';
	import { ApiError } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import {
		formatPrice,
		formatRupees,
		formatArea,
		prettyBhk,
		titleCase,
		initials
	} from '$lib/utils/format';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import Share2 from '@lucide/svelte/icons/share-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import BedDouble from '@lucide/svelte/icons/bed-double';
	import Bath from '@lucide/svelte/icons/bath';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Car from '@lucide/svelte/icons/car';
	import Compass from '@lucide/svelte/icons/compass';
	import Building from '@lucide/svelte/icons/building';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Sofa from '@lucide/svelte/icons/sofa';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import Check from '@lucide/svelte/icons/check';
	import Calculator from '@lucide/svelte/icons/calculator';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Phone from '@lucide/svelte/icons/phone';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';

	let { data } = $props();
	const p = $derived(data.property);

	let activePhoto = $state(0);
	$effect(() => {
		data.property.id;
		activePhoto = 0;
	});

	onMount(() => {
		Properties.trackView(data.property.id);
	});

	const contact = $derived(p.broker ?? p.owner ?? null);
	const isFav = $derived(favorites.has(p.id));

	// Specs grid
	const specs = $derived(
		[
			{ icon: BedDouble, label: 'Configuration', value: prettyBhk(p.bhk) },
			{ icon: Maximize, label: 'Built-up area', value: formatArea(p.areaSqft) },
			p.carpetArea ? { icon: Maximize, label: 'Carpet area', value: formatArea(p.carpetArea) } : null,
			{ icon: Bath, label: 'Bathrooms', value: String(p.bathrooms) },
			{ icon: Car, label: 'Parking', value: p.parkings ? String(p.parkings) : 'None' },
			p.floor ? { icon: Building, label: 'Floor', value: p.totalFloors ? `${p.floor} of ${p.totalFloors}` : p.floor } : null,
			p.facing ? { icon: Compass, label: 'Facing', value: titleCase(p.facing) } : null,
			{ icon: CalendarClock, label: 'Possession', value: titleCase(p.possession) },
			{ icon: Sofa, label: 'Furnishing', value: titleCase(p.furnishing) },
			p.ageYears != null ? { icon: CalendarClock, label: 'Age', value: p.ageYears === 0 ? 'New' : `${p.ageYears} yr` } : null
		].filter(Boolean) as { icon: typeof BedDouble; label: string; value: string }[]
	);

	const mapSrc = $derived(
		p.latitude && p.longitude
			? `https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude - 0.01}%2C${p.latitude - 0.008}%2C${p.longitude + 0.01}%2C${p.latitude + 0.008}&layer=mapnik&marker=${p.latitude}%2C${p.longitude}`
			: null
	);

	// ── Modals & forms ────────────────────────────────────────────
	let inquiryOpen = $state(false);
	let visitOpen = $state(false);
	let sending = $state(false);
	let toast = $state<{ msg: string; ok: boolean } | null>(null);

	let message = $state('');
	let visit = $state({ name: '', phone: '', preferredDate: '', notes: '' });

	function requireAuth(then: () => void) {
		if (!auth.signedIn) {
			goto(`/login?redirect=${encodeURIComponent(page.url.pathname)}`);
			return;
		}
		then();
	}

	function flash(msg: string, ok = true) {
		toast = { msg, ok };
		setTimeout(() => (toast = null), 4000);
	}

	async function sendInquiry() {
		if (!message.trim()) return;
		sending = true;
		try {
			await Leads.inquiry({ propertyId: p.id, message: message.trim() });
			inquiryOpen = false;
			message = '';
			flash('Inquiry sent! The owner will get back to you soon.');
		} catch (e) {
			flash(e instanceof ApiError ? e.message : 'Could not send inquiry.', false);
		} finally {
			sending = false;
		}
	}

	async function sendVisit() {
		if (!visit.name || !visit.phone || !visit.preferredDate) return;
		sending = true;
		try {
			await Leads.siteVisit({
				propertyId: p.id,
				preferredDate: new Date(visit.preferredDate).toISOString(),
				name: visit.name,
				phone: visit.phone,
				notes: visit.notes || undefined
			});
			visitOpen = false;
			flash('Site visit requested! You will be contacted to confirm.');
		} catch (e) {
			flash(e instanceof ApiError ? e.message : 'Could not request visit.', false);
		} finally {
			sending = false;
		}
	}

	async function share() {
		const url = page.url.href;
		try {
			if (navigator.share) await navigator.share({ title: p.title, url });
			else {
				await navigator.clipboard.writeText(url);
				flash('Link copied to clipboard.');
			}
		} catch {
			/* dismissed */
		}
	}

	function prefill() {
		visit.name = auth.name ?? '';
		visit.phone = auth.user?.phone ?? '';
	}
</script>

<svelte:head>
	<title>{p.title} — NxtGenProperties</title>
	<meta name="description" content={p.description ?? `${prettyBhk(p.bhk)} in ${p.locality}, ${p.city}`} />
</svelte:head>

{#if toast}
	<div
		class="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl {toast.ok ? 'bg-success' : 'bg-error'}"
	>
		{toast.msg}
	</div>
{/if}

<div class="container-px pt-28">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-1.5 text-sm text-ink-soft">
		<a href="/" class="hover:text-primary">Home</a>
		<ChevronRight class="size-3.5" />
		<a href={`/properties?type=${p.type}`} class="hover:text-primary">{p.type === 'rent' ? 'Rent' : 'Buy'}</a>
		<ChevronRight class="size-3.5" />
		<a href={`/properties?city=${encodeURIComponent(p.city)}`} class="hover:text-primary">{p.city}</a>
		<ChevronRight class="size-3.5" />
		<span class="line-clamp-1 text-ink">{p.title}</span>
	</nav>
</div>

<!-- Gallery -->
<section class="container-px mt-5">
	<div class="grid gap-3 lg:grid-cols-[2fr_1fr]">
		<div class="relative aspect-video overflow-hidden rounded-2xl bg-card">
			{#if p.photos?.length}
				<img src={p.photos[activePhoto]} alt={p.title} class="size-full object-cover" />
			{:else}
				<div class="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-gold/15">
					<Building class="size-12 text-primary/40" />
				</div>
			{/if}
			<div class="absolute left-4 top-4 flex gap-2">
				<Badge tone="navy">{p.type === 'rent' ? 'For Rent' : 'For Sale'}</Badge>
				{#if p.verified}<Badge tone="success"><BadgeCheck class="size-3.5" /> Verified</Badge>{/if}
				{#if p.featured}<Badge tone="gold">★ Featured</Badge>{/if}
			</div>
		</div>

		{#if p.photos?.length > 1}
			<div class="grid grid-cols-4 gap-3 lg:grid-cols-2">
				{#each p.photos.slice(0, 4) as photo, i (photo)}
					<button
						class="relative aspect-video overflow-hidden rounded-xl ring-2 transition {activePhoto === i ? 'ring-primary' : 'ring-transparent hover:ring-outline-soft'}"
						onclick={() => (activePhoto = i)}
					>
						<img src={photo} alt={`View ${i + 1}`} class="size-full object-cover" />
						{#if i === 3 && p.photos.length > 4}
							<div class="absolute inset-0 grid place-items-center bg-navy/60 font-display font-bold text-white">
								+{p.photos.length - 4}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Body -->
<section class="container-px mt-8 grid gap-10 pb-10 lg:grid-cols-[1.7fr_1fr]">
	<!-- Main column -->
	<div>
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="font-display text-3xl font-extrabold text-navy">{p.title}</h1>
				<p class="mt-2 flex items-center gap-1.5 text-ink-soft">
					<MapPin class="size-4 text-primary" />
					{p.address ?? `${p.locality}, ${p.city}`}
				</p>
			</div>
			<div class="flex gap-2">
				<button
					onclick={() => favorites.toggle(p.id)}
					class="grid size-11 place-items-center rounded-full border border-outline-soft text-navy transition hover:border-primary"
					aria-label="Save"
				>
					<Heart class="size-5 {isFav ? 'fill-error text-error' : ''}" />
				</button>
				<button
					onclick={share}
					class="grid size-11 place-items-center rounded-full border border-outline-soft text-navy transition hover:border-primary"
					aria-label="Share"
				>
					<Share2 class="size-5" />
				</button>
			</div>
		</div>

		<div class="mt-5 flex items-baseline gap-3">
			<p class="font-display text-4xl font-extrabold text-primary">
				{formatPrice(p.price)}{#if p.type === 'rent'}<span class="text-lg font-semibold text-ink-soft">/month</span>{/if}
			</p>
			<span class="text-sm text-ink-soft">{formatRupees(p.price)}</span>
		</div>
		{#if p.maintenance || p.deposit}
			<p class="mt-1 text-sm text-ink-soft">
				{#if p.maintenance}Maintenance {formatRupees(p.maintenance)}/mo{/if}
				{#if p.maintenance && p.deposit} · {/if}
				{#if p.deposit}Deposit {formatRupees(p.deposit)}{/if}
			</p>
		{/if}

		<!-- Specs -->
		<div class="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-outline-soft/60 bg-card p-5 sm:grid-cols-3">
			{#each specs as s (s.label)}
				{@const Icon = s.icon}
				<div class="flex items-center gap-3">
					<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-primary">
						<Icon class="size-5" />
					</span>
					<div>
						<p class="text-xs text-ink-soft">{s.label}</p>
						<p class="font-display font-bold text-navy">{s.value}</p>
					</div>
				</div>
			{/each}
		</div>

		{#if p.description}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">About this property</h2>
				<p class="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{p.description}</p>
			</div>
		{/if}

		{#if p.amenities?.length}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">Amenities</h2>
				<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each p.amenities as a (a)}
						<div class="flex items-center gap-2 rounded-xl border border-outline-soft/60 bg-surface px-4 py-3 text-sm text-ink">
							<span class="grid size-6 place-items-center rounded-full bg-primary-container text-primary">
								<Check class="size-3.5" />
							</span>
							{a}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if mapSrc}
			<div class="mt-10">
				<h2 class="font-display text-xl font-bold text-navy">Location</h2>
				<div class="mt-4 overflow-hidden rounded-2xl border border-outline-soft/60">
					<iframe title="Map" src={mapSrc} class="h-80 w-full" loading="lazy"></iframe>
				</div>
			</div>
		{/if}
	</div>

	<!-- Sidebar -->
	<aside class="lg:sticky lg:top-24 lg:self-start">
		<div class="rounded-2xl border border-outline-soft/60 bg-surface p-6 shadow-sm">
			{#if contact}
				<div class="flex items-center gap-3">
					{#if contact.avatarUrl}
						<img src={contact.avatarUrl} alt={contact.name} class="size-12 rounded-full object-cover" />
					{:else}
						<span class="grid size-12 place-items-center rounded-full bg-primary text-white font-bold">
							{initials(contact.name)}
						</span>
					{/if}
					<div>
						<p class="flex items-center gap-1.5 font-display font-bold text-navy">
							{contact.name}
							{#if contact.verifiedBroker}<BadgeCheck class="size-4 text-primary" />{/if}
						</p>
						<p class="text-xs capitalize text-ink-soft">
							{contact.role ?? 'Listed by'}{#if contact.role === 'broker'} · Broker{/if}
						</p>
					</div>
				</div>
			{:else}
				<p class="font-display font-bold text-navy">Interested in this property?</p>
			{/if}

			<div class="mt-5 space-y-2.5">
				<Button class="w-full" onclick={() => requireAuth(() => (inquiryOpen = true))}>
					<Phone class="size-4" /> Contact {contact?.role === 'broker' ? 'broker' : 'owner'}
				</Button>
				<Button variant="outline" class="w-full" onclick={() => requireAuth(() => { prefill(); visitOpen = true; })}>
					<CalendarDays class="size-4" /> Schedule a site visit
				</Button>
			</div>

			<!-- EMI teaser -->
			{#if p.type === 'buy'}
				<a
					href={`/tools/emi?price=${p.price}`}
					class="mt-5 flex items-center gap-3 rounded-xl bg-card p-4 transition hover:bg-surface-variant"
				>
					<span class="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold">
						<Calculator class="size-5" />
					</span>
					<div class="flex-1">
						<p class="text-xs text-ink-soft">Estimated EMI</p>
						<p class="font-display font-bold text-navy">
							{formatPrice(Math.round((p.price * 0.8 * 0.0073 * Math.pow(1.0073, 240)) / (Math.pow(1.0073, 240) - 1)))}/mo
						</p>
					</div>
					<ChevronRight class="size-5 text-ink-soft" />
				</a>
			{/if}
		</div>
	</aside>
</section>

<!-- Similar -->
{#if data.similar.length}
	<section class="container-px py-12">
		<h2 class="font-display text-2xl font-extrabold text-navy">Similar properties</h2>
		<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.similar as property (property.id)}
				<PropertyCard {property} />
			{/each}
		</div>
	</section>
{/if}

<!-- Inquiry modal -->
<Modal bind:open={inquiryOpen} title="Send an inquiry" description="Your message goes straight to the lister.">
	<form onsubmit={(e) => { e.preventDefault(); sendInquiry(); }} class="space-y-4">
		<textarea
			bind:value={message}
			rows="4"
			placeholder={`Hi, I'm interested in "${p.title}". Is it still available?`}
			class="w-full rounded-xl border border-outline-soft bg-surface p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
		></textarea>
		<Button type="submit" class="w-full" loading={sending}>Send inquiry</Button>
	</form>
</Modal>

<!-- Site visit modal -->
<Modal bind:open={visitOpen} title="Schedule a site visit" description="Pick a date and we'll coordinate with the lister.">
	<form onsubmit={(e) => { e.preventDefault(); sendVisit(); }} class="space-y-3">
		<Input bind:value={visit.name} placeholder="Your name" required />
		<Input bind:value={visit.phone} type="tel" placeholder="Phone number" required />
		<Input bind:value={visit.preferredDate} type="datetime-local" required />
		<textarea
			bind:value={visit.notes}
			rows="2"
			placeholder="Any notes (optional)"
			class="w-full rounded-xl border border-outline-soft bg-surface p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
		></textarea>
		<Button type="submit" class="w-full" loading={sending}>Request visit</Button>
	</form>
</Modal>
