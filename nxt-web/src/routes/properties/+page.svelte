<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Properties } from '$lib/api/endpoints';
	import type { Property } from '$lib/api/types';
	import PropertyCard from '$lib/components/PropertyCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { cn } from '$lib/utils/cn';
	import { prettyBhk } from '$lib/utils/format';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';
	import Frown from '@lucide/svelte/icons/frown';

	let { data } = $props();

	// Initial value only — the box reflects the URL's q on first load, then the
	// user owns it. `untrack` documents that the one-time capture is intentional.
	let query = $state(untrack(() => data.filters.q ?? ''));
	let showFilters = $state(false);

	// Appended pages (load-more) — (re)initialised from `data` by the $effect
	// below, which also re-runs whenever a new page load resolves.
	let appended = $state<Property[]>([]);
	let offset = $state(0);
	let hasMore = $state(false);
	let loadingMore = $state(false);

	$effect(() => {
		// Re-runs when a new page load resolves (filter / nav change).
		data.items;
		appended = [];
		offset = data.pageSize;
		hasMore = data.hasMore;
	});

	const items = $derived([...data.items, ...appended]);

	const BHK = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'];
	const FURNISHING = ['furnished', 'semi-furnished', 'unfurnished'];
	const FACING = ['east', 'west', 'north', 'south', 'north-east', 'north-west', 'south-east', 'south-west'];
	const sortOptions = [
		{ value: '', label: 'Recommended' },
		{ value: 'price_low_high', label: 'Price: Low to High' },
		{ value: 'price_high_low', label: 'Price: High to Low' },
		{ value: 'area_high_low', label: 'Area: Large to Small' }
	];

	const cityOptions = $derived([
		{ value: '', label: 'All cities' },
		...data.cities.map((c) => ({ value: c.name, label: c.name }))
	]);

	function current() {
		return new URLSearchParams(page.url.searchParams);
	}
	function apply(params: URLSearchParams) {
		const s = params.toString();
		goto(s ? `/properties?${s}` : '/properties', { keepFocus: true, noScroll: true });
	}
	function setParam(key: string, value?: string | null) {
		const p = current();
		if (value) p.set(key, value);
		else p.delete(key);
		apply(p);
	}
	function toggleCsv(key: string, value: string) {
		const p = current();
		const set = new Set((p.get(key) ?? '').split(',').filter(Boolean));
		set.has(value) ? set.delete(value) : set.add(value);
		set.size ? p.set(key, [...set].join(',')) : p.delete(key);
		apply(p);
	}
	function inCsv(key: string, value: string) {
		return (page.url.searchParams.get(key) ?? '').split(',').includes(value);
	}
	function submitSearch() {
		setParam('q', query.trim() || null);
	}
	function clearAll() {
		query = '';
		goto('/properties', { keepFocus: true, noScroll: true });
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await Properties.list({ ...data.filters, offset });
			appended = [...appended, ...res.items];
			offset += data.pageSize;
			hasMore = res.hasMore ?? false;
		} catch {
			hasMore = false;
		} finally {
			loadingMore = false;
		}
	}

	const activeType = $derived(page.url.searchParams.get('type') ?? '');
	const activeCategory = $derived(page.url.searchParams.get('category') ?? '');
	const priceList = $derived(data.priceRanges[activeType || 'buy'] ?? data.priceRanges.buy ?? []);

	// Count active filters for the "Filters" button badge.
	const activeCount = $derived(
		[...page.url.searchParams.keys()].filter(
			(k) => !['limit', 'offset', 'q', 'sort'].includes(k)
		).length
	);
</script>

<svelte:head>
	<title>Properties for {activeType === 'rent' ? 'Rent' : 'Sale'} — NxtGenProperties</title>
</svelte:head>

<!-- Sticky search + filter bar -->
<div class="sticky top-0 z-40 border-b border-outline-soft/60 bg-surface/90 pt-20 backdrop-blur">
	<div class="container-px py-4">
		<div class="flex flex-wrap items-center gap-3">
			<div class="relative min-w-60 flex-1">
				<Search class="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
				<input
					bind:value={query}
					onkeydown={(e) => e.key === 'Enter' && submitSearch()}
					placeholder="Search by locality, city or title…"
					class="h-11 w-full rounded-xl border border-outline-soft bg-surface pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
				/>
			</div>

			<!-- Buy / Rent toggle -->
			<div class="flex h-11 items-center rounded-xl bg-card p-1">
				{#each [{ v: '', l: 'All' }, { v: 'buy', l: 'Buy' }, { v: 'rent', l: 'Rent' }] as t (t.v)}
					<button
						class={cn('h-9 rounded-lg px-4 text-sm font-semibold transition', activeType === t.v ? 'bg-primary text-white shadow' : 'text-ink-soft hover:text-ink')}
						onclick={() => setParam('type', t.v || null)}
					>
						{t.l}
					</button>
				{/each}
			</div>

			<Select
				value={page.url.searchParams.get('sort') ?? ''}
				options={sortOptions}
				onchange={(e) => setParam('sort', (e.currentTarget as HTMLSelectElement).value || null)}
				class="w-48"
			/>

			<button
				class={cn('flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition', showFilters || activeCount ? 'border-primary text-primary' : 'border-outline-soft text-ink')}
				onclick={() => (showFilters = !showFilters)}
			>
				<SlidersHorizontal class="size-4" /> Filters
				{#if activeCount}<span class="grid size-5 place-items-center rounded-full bg-primary text-xs text-white">{activeCount}</span>{/if}
			</button>
		</div>

		<!-- Expandable filter panel -->
		{#if showFilters}
			<div class="mt-4 grid gap-5 rounded-2xl border border-outline-soft/60 bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">City</p>
					<Select
						value={page.url.searchParams.get('city') ?? ''}
						options={cityOptions}
						onchange={(e) => setParam('city', (e.currentTarget as HTMLSelectElement).value || null)}
					/>
				</div>
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Category</p>
					<div class="flex gap-2">
						{#each [{ v: 'residential', l: 'Residential' }, { v: 'commercial', l: 'Commercial' }] as c (c.v)}
							<button
								class={cn('h-10 flex-1 rounded-xl border text-sm font-medium transition', activeCategory === c.v ? 'border-primary bg-primary-container text-primary' : 'border-outline-soft hover:border-primary')}
								onclick={() => setParam('category', activeCategory === c.v ? null : c.v)}
							>{c.l}</button>
						{/each}
					</div>
				</div>
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Min price</p>
					<Select
						value={page.url.searchParams.get('minPrice') ?? ''}
						options={[{ value: '', label: 'No min' }, ...priceList.map((r) => ({ value: String(r.min), label: r.label.split(' - ')[0].replace('Under ', '₹0+') }))]}
						onchange={(e) => setParam('minPrice', (e.currentTarget as HTMLSelectElement).value || null)}
					/>
				</div>
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Max price</p>
					<Select
						value={page.url.searchParams.get('maxPrice') ?? ''}
						options={[{ value: '', label: 'No max' }, ...priceList.filter((r) => r.max).map((r) => ({ value: String(r.max), label: `Up to ${r.label.split(' - ').pop()}` }))]}
						onchange={(e) => setParam('maxPrice', (e.currentTarget as HTMLSelectElement).value || null)}
					/>
				</div>

				<div class="sm:col-span-2 lg:col-span-4">
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Configuration (BHK)</p>
					<div class="flex flex-wrap gap-2">
						{#each BHK as b (b)}
							<button
								class={cn('rounded-full border px-4 py-2 text-sm font-medium transition', inCsv('bhk', b) ? 'border-primary bg-primary text-white' : 'border-outline-soft hover:border-primary')}
								onclick={() => toggleCsv('bhk', b)}
							>{prettyBhk(b)}</button>
						{/each}
					</div>
				</div>

				<div class="sm:col-span-2">
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Furnishing</p>
					<div class="flex flex-wrap gap-2">
						{#each FURNISHING as f (f)}
							<button
								class={cn('rounded-full border px-4 py-2 text-sm font-medium capitalize transition', inCsv('furnishing', f) ? 'border-primary bg-primary text-white' : 'border-outline-soft hover:border-primary')}
								onclick={() => toggleCsv('furnishing', f)}
							>{f.replace('-', ' ')}</button>
						{/each}
					</div>
				</div>
				<div class="sm:col-span-2">
					<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Facing</p>
					<div class="flex flex-wrap gap-2">
						{#each FACING as f (f)}
							<button
								class={cn('rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition', inCsv('facing', f) ? 'border-primary bg-primary text-white' : 'border-outline-soft hover:border-primary')}
								onclick={() => toggleCsv('facing', f)}
							>{f.replace('-', '-')}</button>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 sm:col-span-2 lg:col-span-4">
					<button class="text-sm font-semibold text-ink-soft hover:text-error" onclick={clearAll}>
						Clear all
					</button>
					<Button size="sm" onclick={() => (showFilters = false)}>Show results</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Results -->
<section class="container-px py-10">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl font-extrabold text-navy">
				{activeType === 'rent' ? 'Homes for rent' : activeType === 'buy' ? 'Homes for sale' : 'All properties'}
			</h1>
			<p class="mt-1 text-sm text-ink-soft">
				{items.length}{hasMore ? '+' : ''} result{items.length === 1 ? '' : 's'}
				{#if page.url.searchParams.get('city')}in {page.url.searchParams.get('city')}{/if}
			</p>
		</div>

		{#if activeCount || page.url.searchParams.get('q')}
			<div class="flex flex-wrap items-center gap-2">
				{#each [...page.url.searchParams.entries()].filter(([k]) => !['limit', 'offset', 'sort'].includes(k)) as [k, v] (k + v)}
					<button
						class="flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary-deep"
						onclick={() => setParam(k, null)}
					>
						{prettyBhk(v)} <X class="size-3" />
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if items.length}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each items as property (property.id)}
				<PropertyCard {property} />
			{/each}
		</div>

		{#if hasMore}
			<div class="mt-12 flex justify-center">
				<Button variant="outline" size="lg" loading={loadingMore} onclick={loadMore}>
					{loadingMore ? 'Loading…' : 'Load more properties'}
				</Button>
			</div>
		{/if}
	{:else}
		<div class="grid place-items-center gap-3 rounded-3xl border border-dashed border-outline-soft bg-card py-24 text-center">
			<Frown class="size-12 text-ink-soft/50" />
			<p class="font-display text-xl font-bold text-navy">No properties match your filters</p>
			<p class="max-w-sm text-sm text-ink-soft">Try widening your price range or clearing a few filters.</p>
			<Button variant="outline" size="sm" class="mt-2" onclick={clearAll}>Clear all filters</Button>
		</div>
	{/if}
</section>
