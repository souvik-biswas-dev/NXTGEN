<script lang="ts">
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/actions/reveal';
	import { formatPrice } from '$lib/utils/format';
	import SectionHeading from '$lib/components/SectionHeading.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { cn } from '$lib/utils/cn';
	import Building2 from '@lucide/svelte/icons/building-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';

	let { data } = $props();

	function filterCity(city: string) {
		goto(city ? `/projects?city=${encodeURIComponent(city)}` : '/projects', { noScroll: true });
	}
</script>

<svelte:head>
	<title>New Launches — NxtGenProperties</title>
</svelte:head>

<section class="bg-navy pb-12 pt-32 text-white">
	<div class="container-px">
		<span class="text-xs font-bold uppercase tracking-[0.2em] text-gold">New launches</span>
		<h1 class="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Tomorrow's landmarks, today</h1>
		<p class="mt-3 max-w-xl text-white/70">
			Explore upcoming and newly launched projects from India's most trusted developers.
		</p>

		<div class="mt-7 flex flex-wrap gap-2">
			<button
				class={cn('rounded-full px-4 py-2 text-sm font-semibold transition', !data.city ? 'bg-white text-navy' : 'bg-white/10 text-white hover:bg-white/20')}
				onclick={() => filterCity('')}
			>
				All cities
			</button>
			{#each data.cities.slice(0, 8) as c (c.id)}
				<button
					class={cn('rounded-full px-4 py-2 text-sm font-semibold transition', data.city === c.name ? 'bg-white text-navy' : 'bg-white/10 text-white hover:bg-white/20')}
					onclick={() => filterCity(c.name)}
				>
					{c.name}
				</button>
			{/each}
		</div>
	</div>
</section>

<section class="container-px py-14">
	{#if data.items.length}
		<div class="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.items as project, i (project.id)}
				<a
					use:reveal={{ delay: (i % 3) * 70 }}
					href={`/projects/${project.id}`}
					class="card-elevate group overflow-hidden rounded-2xl border border-outline-soft/60 bg-surface"
				>
					<div class="relative aspect-video overflow-hidden bg-surface-variant">
						{#if project.coverImage}
							<img src={project.coverImage} alt={project.name} loading="lazy" class="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
						{:else}
							<div class="grid size-full place-items-center bg-linear-to-br from-primary/15 to-gold/15">
								<Building2 class="size-10 text-primary/40" />
							</div>
						{/if}
						<div class="absolute left-3 top-3 flex gap-2">
							{#if project.featured}<Badge tone="gold">★ Featured</Badge>{/if}
							{#if project.verified}<Badge tone="success">RERA</Badge>{/if}
						</div>
						<span class="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white/90 text-navy opacity-0 transition group-hover:opacity-100">
							<ArrowUpRight class="size-5" />
						</span>
					</div>
					<div class="p-5">
						<p class="text-xs font-semibold uppercase tracking-wide text-primary">{project.developer}</p>
						<h3 class="mt-1 font-display text-lg font-bold text-navy">{project.name}</h3>
						<p class="mt-1 flex items-center gap-1 text-sm text-ink-soft">
							<MapPin class="size-3.5 text-primary" />{project.location}
						</p>
						<div class="mt-4 flex items-center justify-between border-t border-outline-soft/60 pt-4">
							{#if project.priceMin}
								<p class="font-display font-bold text-navy">
									{formatPrice(project.priceMin)}{#if project.priceMax}<span class="text-ink-soft"> – {formatPrice(project.priceMax)}</span>{/if}
								</p>
							{:else}
								<p class="text-sm text-ink-soft">Price on request</p>
							{/if}
							{#if project.possessionDate}
								<span class="text-xs text-ink-soft">Possession {project.possessionDate}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="grid place-items-center gap-3 rounded-3xl border border-dashed border-outline-soft bg-card py-24 text-center">
			<Building2 class="size-12 text-ink-soft/50" />
			<p class="font-display text-xl font-bold text-navy">No projects {data.city ? `in ${data.city}` : 'yet'}</p>
			<p class="text-sm text-ink-soft">Check back soon for new launches.</p>
		</div>
	{/if}
</section>
