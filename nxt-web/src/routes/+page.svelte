<script lang="ts">
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/actions/reveal';
	import { formatPrice } from '$lib/utils/format';
	import Hero3D from '$lib/components/Hero3D.svelte';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import SectionHeading from '$lib/components/SectionHeading.svelte';
	import CountUp from '$lib/components/CountUp.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Search from '@lucide/svelte/icons/search';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Building2 from '@lucide/svelte/icons/building-2';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import MessagesSquare from '@lucide/svelte/icons/messages-square';
	import Calculator from '@lucide/svelte/icons/calculator';
	import GitCompare from '@lucide/svelte/icons/git-compare';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Component } from 'svelte';

	let { data } = $props();

	// Hero search state
	let mode = $state<'buy' | 'rent'>('buy');
	let query = $state('');
	function search() {
		const params = new URLSearchParams({ type: mode });
		if (query.trim()) params.set('q', query.trim());
		goto(`/properties?${params}`);
	}

	const totalListings = $derived(data.cities.reduce((s, c) => s + (c.properties ?? 0), 0));

	// Map ionicon-style names from the backend to Lucide components.
	const featureIcons: Record<string, Component> = {
		'search-outline': Search,
		'shield-checkmark-outline': ShieldCheck,
		'chatbubbles-outline': MessagesSquare,
		'calculator-outline': Calculator,
		'trending-up-outline': TrendingUp,
		'git-compare-outline': GitCompare
	};

	const fallbackFeatures = [
		{ icon: 'search-outline', title: 'Smart Search', description: 'Filter by location, price, BHK and more to find the perfect property.' },
		{ icon: 'shield-checkmark-outline', title: 'Verified Listings', description: 'RERA-verified brokers and owner-posted listings you can trust.' },
		{ icon: 'chatbubbles-outline', title: 'Direct Chat', description: 'Connect directly with owners and brokers — no middlemen.' },
		{ icon: 'calculator-outline', title: 'Financial Tools', description: 'Built-in EMI and budget calculators to plan your investment.' },
		{ icon: 'trending-up-outline', title: 'Market Insights', description: 'Real-time price trends and locality reports at your fingertips.' },
		{ icon: 'git-compare-outline', title: 'Compare Properties', description: 'Side-by-side comparison of your shortlisted homes.' }
	];
	const features = $derived(data.features.length ? data.features : fallbackFeatures);
</script>

<svelte:head>
	<title>NxtGenProperties — Find your next home in India</title>
</svelte:head>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="relative flex min-h-screen items-center overflow-hidden bg-navy">
	<div class="absolute inset-0 bg-linear-to-b from-navy via-[#13202e] to-[#0b1620]"></div>
	<div class="absolute inset-0 opacity-90">
		<Hero3D />
	</div>
	<div class="absolute inset-0 bg-linear-to-r from-navy/85 via-navy/30 to-transparent"></div>
	<div class="pointer-events-none absolute -right-40 top-1/4 size-136 rounded-full bg-primary/20 blur-3xl"></div>

	<div class="container-px relative z-10 w-full pb-16 pt-32">
		<div class="max-w-2xl">
			<span use:reveal class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
				<Sparkles class="size-3.5 text-gold" /> India's next-generation property marketplace
			</span>

			<h1 use:reveal={{ delay: 80 }} class="mt-6 font-display text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
				Find a place<br />you'll love to call
				<span class="text-gradient">home.</span>
			</h1>

			<p use:reveal={{ delay: 160 }} class="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
				Discover verified homes, plots and commercial spaces across India — and connect directly
				with owners and brokers, all in one beautifully simple place.
			</p>

			<div use:reveal={{ delay: 240 }} class="glass mt-9 max-w-xl rounded-2xl border border-white/40 p-3 shadow-2xl">
				<div class="mb-3 flex gap-1 rounded-full bg-white/60 p-1">
					{#each ['buy', 'rent'] as const as m (m)}
						<button
							class="flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-all {mode === m ? 'bg-primary text-white shadow' : 'text-navy/70 hover:text-navy'}"
							onclick={() => (mode = m)}
						>
							{m === 'buy' ? 'Buy' : 'Rent'}
						</button>
					{/each}
				</div>
				<div class="flex flex-col gap-2 sm:flex-row">
					<div class="relative flex-1">
						<MapPin class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
						<input
							bind:value={query}
							onkeydown={(e) => e.key === 'Enter' && search()}
							placeholder="Search city, locality or project…"
							class="h-13 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-sm text-navy outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-primary"
						/>
					</div>
					<Button size="lg" onclick={search} class="h-13">
						<Search class="size-5" /> Search
					</Button>
				</div>
			</div>

			<div use:reveal={{ delay: 320 }} class="mt-10 flex flex-wrap gap-x-10 gap-y-4">
				<div>
					<p class="font-display text-3xl font-extrabold text-white">
						<CountUp value={totalListings || 13300} suffix="+" />
					</p>
					<p class="text-sm text-white/60">Active listings</p>
				</div>
				<div>
					<p class="font-display text-3xl font-extrabold text-white">
						<CountUp value={data.cities.length || 10} suffix="+" />
					</p>
					<p class="text-sm text-white/60">Cities covered</p>
				</div>
				<div>
					<p class="font-display text-3xl font-extrabold text-white">
						<CountUp value={4500} suffix="+" />
					</p>
					<p class="text-sm text-white/60">Verified brokers</p>
				</div>
			</div>
		</div>
	</div>

	<a href="#featured" class="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/60 transition hover:text-white" aria-label="Scroll down">
		<ChevronDown class="size-7 animate-bounce" />
	</a>
</section>

<!-- ═══════════════════ FEATURED ═══════════════════ -->
<section id="featured" class="container-px scroll-mt-24 py-24">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<SectionHeading
			eyebrow="Handpicked"
			title="Featured properties"
			subtitle="A curated selection of standout homes posted by verified owners and brokers."
		/>
		<a use:reveal href="/properties" class="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
			View all listings
			<ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
		</a>
	</div>

	{#if data.featured.length}
		<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.featured as property, i (property.id)}
				<div use:reveal={{ delay: i * 70 }}>
					<PropertyCard {property} eager={i < 3} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="mt-10 grid place-items-center gap-3 rounded-3xl border border-dashed border-outline-soft bg-card py-20 text-center">
			<Building2 class="size-10 text-primary/60" />
			<p class="font-display text-lg font-bold text-navy">No live listings yet</p>
			<p class="max-w-sm text-sm text-ink-soft">
				Start the backend API (<code class="rounded bg-surface px-1.5 py-0.5 text-xs">localhost:4000</code>) and
				seed the database to see featured homes here.
			</p>
			<Button href="/properties" variant="outline" size="sm" class="mt-2">Browse anyway</Button>
		</div>
	{/if}
</section>

<!-- ═══════════════════ POPULAR CITIES ═══════════════════ -->
{#if data.cities.length}
	<section class="bg-card py-24">
		<div class="container-px">
			<SectionHeading
				eyebrow="Where to look"
				title="Explore top cities"
				subtitle="From Mumbai's skyline to Bengaluru's tech corridors — find your market."
				align="center"
			/>
			<div class="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				{#each data.cities.slice(0, 10) as city, i (city.id)}
					<a
						use:reveal={{ delay: (i % 5) * 60 }}
						href={`/properties?city=${encodeURIComponent(city.name)}`}
						class="card-elevate group flex items-center justify-between gap-2 rounded-2xl border border-outline-soft/60 bg-surface p-4"
					>
						<div>
							<p class="font-display font-bold text-navy">{city.name}</p>
							<p class="text-xs text-ink-soft">{city.properties.toLocaleString('en-IN')} homes</p>
						</div>
						<span class="grid size-9 place-items-center rounded-full bg-primary-container text-primary transition group-hover:bg-primary group-hover:text-white">
							<ArrowUpRight class="size-4" />
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ═══════════════════ WHY NXTGEN ═══════════════════ -->
<section id="why" class="container-px scroll-mt-24 py-24">
	<SectionHeading
		eyebrow="Why NxtGen"
		title="Everything you need to move with confidence"
		subtitle="A modern toolkit built for India's home seekers, owners and brokers."
		align="center"
	/>
	<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each features as f, i (f.title)}
			{@const Icon = featureIcons[f.icon] ?? Sparkles}
			<div
				use:reveal={{ delay: (i % 3) * 80 }}
				class="card-elevate group rounded-2xl border border-outline-soft/60 bg-surface p-7"
			>
				<span class="grid size-12 place-items-center rounded-xl bg-primary-container text-primary transition group-hover:bg-primary group-hover:text-white">
					<Icon class="size-6" />
				</span>
				<h3 class="mt-5 font-display text-lg font-bold text-navy">{f.title}</h3>
				<p class="mt-2 text-sm leading-relaxed text-ink-soft">{f.description}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ═══════════════════ NEW LAUNCHES ═══════════════════ -->
{#if data.projects.length}
	<section class="bg-card py-24">
		<div class="container-px">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading
					eyebrow="Fresh on the market"
					title="New project launches"
					subtitle="Be first to invest in upcoming developments from top builders."
				/>
				<a use:reveal href="/projects" class="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
					All projects <ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
				</a>
			</div>
			<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.projects as project, i (project.id)}
					{@const cover = project.coverImage}
					{@const lo = project.priceMin}
					{@const hi = project.priceMax}
					<a
						use:reveal={{ delay: i * 70 }}
						href={`/projects/${project.id}`}
						class="card-elevate group overflow-hidden rounded-2xl border border-outline-soft/60 bg-surface"
					>
						<div class="relative aspect-4/3 overflow-hidden bg-surface-variant">
							{#if cover}
								<img src={cover} alt={project.name} loading="lazy" class="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
							{:else}
								<div class="grid size-full place-items-center bg-linear-to-br from-primary/15 to-gold/15">
									<Building2 class="size-8 text-primary/40" />
								</div>
							{/if}
							{#if project.featured}
								<div class="absolute left-3 top-3"><Badge tone="gold">★ Featured</Badge></div>
							{/if}
						</div>
						<div class="p-4">
							<p class="text-xs font-semibold uppercase tracking-wide text-primary">{project.developer}</p>
							<h3 class="mt-1 line-clamp-1 font-display text-base font-bold text-navy">{project.name}</h3>
							<p class="mt-1 line-clamp-1 text-sm text-ink-soft">{project.location}</p>
							{#if lo}
								<p class="mt-3 font-display text-sm font-bold text-navy">
									{formatPrice(lo)}{#if hi} – {formatPrice(hi)}{/if}
								</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ═══════════════════ MARKET TRENDS ═══════════════════ -->
{#if data.trends.length}
	<section class="container-px py-24">
		<SectionHeading
			eyebrow="Market pulse"
			title="Price trends across India"
			subtitle="Year-on-year average price movement in key markets."
		/>
		<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.trends as t, i (t.city)}
				<div use:reveal={{ delay: (i % 3) * 70 }} class="rounded-2xl border border-outline-soft/60 bg-surface p-6">
					<div class="flex items-center justify-between">
						<p class="font-display text-lg font-bold text-navy">{t.city}</p>
						<span class="flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-bold text-[#0a7a52]">
							<TrendingUp class="size-3.5" />{t.change}
						</span>
					</div>
					<p class="mt-4 font-display text-3xl font-extrabold text-primary">₹{t.avgPrice}<span class="text-sm font-medium text-ink-soft">/sq.ft</span></p>
					<p class="mt-1 text-xs uppercase tracking-wide text-ink-soft">{t.period} growth</p>
				</div>
			{/each}
		</div>
	</section>
{/if}

<!-- ═══════════════════ CTA ═══════════════════ -->
<section class="container-px pb-8 pt-4">
	<div use:reveal class="relative overflow-hidden rounded-4xl bg-linear-to-br from-primary via-primary-deep to-navy px-8 py-16 text-center sm:px-16">
		<div class="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-gold/30 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-24 -right-10 size-80 rounded-full bg-primary-bright/30 blur-3xl"></div>
		<div class="relative mx-auto max-w-2xl">
			<h2 class="font-display text-3xl font-extrabold text-white sm:text-4xl">
				Have a property to sell or rent?
			</h2>
			<p class="mx-auto mt-4 max-w-lg text-white/80">
				List it free in minutes and reach thousands of serious buyers and tenants. Owners and brokers welcome.
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<Button href="/register" variant="gold" size="lg">Post your property <ArrowRight class="size-5" /></Button>
				<Button href="/properties" variant="glass" size="lg">Browse listings</Button>
			</div>
		</div>
	</div>
</section>
