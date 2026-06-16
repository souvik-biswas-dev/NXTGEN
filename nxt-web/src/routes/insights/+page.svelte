<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import SectionHeading from '$lib/components/SectionHeading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils/cn';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { data } = $props();
	let openFaq = $state<string | null>(null);
</script>

<svelte:head><title>Market Insights — NxtGenProperties</title></svelte:head>

<section class="bg-navy pb-16 pt-32 text-white">
	<div class="container-px">
		<span class="text-xs font-bold uppercase tracking-[0.2em] text-gold">Market pulse</span>
		<h1 class="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Insights to invest smarter</h1>
		<p class="mt-3 max-w-xl text-white/70">Price trends, plans and answers — everything to make a confident move.</p>
	</div>
</section>

<!-- Trends -->
{#if data.trends.length}
	<section class="container-px py-16">
		<SectionHeading eyebrow="Price trends" title="Average price per sq.ft" subtitle="Year-on-year movement across India's leading markets." />
		<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.trends as t, i (t.city)}
				<div use:reveal={{ delay: (i % 3) * 60 }} class="rounded-2xl border border-outline-soft/60 bg-surface p-6">
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

<!-- Plans -->
{#if data.plans.length}
	<section class="bg-card py-20">
		<div class="container-px">
			<SectionHeading eyebrow="Membership" title="Plans for owners & brokers" subtitle="List more, rank higher, close faster." align="center" />
			<div class="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
				{#each data.plans as plan, i (plan.plan)}
					{@const featured = plan.plan === 'silver'}
					<div
						use:reveal={{ delay: i * 80 }}
						class={cn('relative rounded-2xl border bg-surface p-7', featured ? 'border-primary shadow-xl shadow-primary/10 lg:-translate-y-3' : 'border-outline-soft/60')}
					>
						{#if featured}
							<span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">Most popular</span>
						{/if}
						<p class="font-display text-lg font-bold text-navy">{plan.name}</p>
						<p class="mt-3 font-display text-4xl font-extrabold text-navy">
							{plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
							{#if plan.price > 0}<span class="text-sm font-medium text-ink-soft">/mo</span>{/if}
						</p>
						<ul class="mt-6 space-y-3">
							{#each plan.features as f (f)}
								<li class="flex items-center gap-2 text-sm text-ink">
									<span class="grid size-5 place-items-center rounded-full bg-primary-container text-primary"><Check class="size-3" /></span>{f}
								</li>
							{/each}
						</ul>
						<Button href="/register" variant={featured ? 'primary' : 'outline'} class="mt-7 w-full">
							{plan.price === 0 ? 'Get started' : 'Choose plan'}
						</Button>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- FAQs -->
{#if data.faqs.length}
	<section class="container-px py-20">
		<SectionHeading eyebrow="Help" title="Frequently asked questions" align="center" />
		<div class="mx-auto mt-10 max-w-3xl space-y-8">
			{#each data.faqs as group (group.category)}
				<div>
					<h3 class="font-display text-sm font-bold uppercase tracking-wide text-primary">{group.category}</h3>
					<div class="mt-3 divide-y divide-outline-soft/60 overflow-hidden rounded-2xl border border-outline-soft/60 bg-surface">
						{#each group.items as item (item.q)}
							{@const id = group.category + item.q}
							<div>
								<button
									class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
									onclick={() => (openFaq = openFaq === id ? null : id)}
								>
									<span class="font-semibold text-navy">{item.q}</span>
									<ChevronDown class={cn('size-5 shrink-0 text-ink-soft transition-transform', openFaq === id && 'rotate-180')} />
								</button>
								{#if openFaq === id}
									<p class="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{item.a}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}
