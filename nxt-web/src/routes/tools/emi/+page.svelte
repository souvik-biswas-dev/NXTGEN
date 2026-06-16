<script lang="ts">
	import { page } from '$app/state';
	import { formatPrice, formatRupees } from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';
	import Calculator from '@lucide/svelte/icons/calculator';
	import Landmark from '@lucide/svelte/icons/landmark';

	let { data } = $props();

	const priceParam = Number(page.url.searchParams.get('price') ?? 0);

	let amount = $state(priceParam ? Math.round(priceParam * 0.8) : 5_000_000);
	let rate = $state(8.5);
	let years = $state(20);

	const months = $derived(years * 12);
	const r = $derived(rate / 12 / 100);
	const emi = $derived(
		r === 0 ? amount / months : (amount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
	);
	const totalPayment = $derived(emi * months);
	const totalInterest = $derived(totalPayment - amount);
	const principalPct = $derived(Math.round((amount / totalPayment) * 100));

	// Donut geometry
	const R = 70;
	const C = 2 * Math.PI * R;
	const principalDash = $derived((amount / totalPayment) * C);

	const fmtCr = (n: number) => formatPrice(Math.round(n));
</script>

<svelte:head><title>EMI Calculator — NxtGenProperties</title></svelte:head>

<section class="bg-navy pb-16 pt-32 text-white">
	<div class="container-px">
		<span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
			<Calculator class="size-4" /> Financial tools
		</span>
		<h1 class="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Home Loan EMI Calculator</h1>
		<p class="mt-3 max-w-xl text-white/70">
			Estimate your monthly instalment and total interest. Adjust the sliders to plan your budget.
		</p>
	</div>
</section>

<section class="container-px -mt-10 pb-8">
	<div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
		<!-- Inputs -->
		<div class="rounded-2xl border border-outline-soft/60 bg-surface p-7 shadow-sm">
			<!-- Loan amount -->
			<div class="flex items-center justify-between">
				<label for="amt" class="text-sm font-semibold text-navy">Loan amount</label>
				<span class="font-display text-lg font-extrabold text-primary">{formatRupees(amount)}</span>
			</div>
			<input id="amt" type="range" min="500000" max="100000000" step="100000" bind:value={amount} class="mt-3 w-full accent-primary" />
			<div class="mt-1 flex justify-between text-xs text-ink-soft"><span>₹5 L</span><span>₹10 Cr</span></div>

			<!-- Interest rate -->
			<div class="mt-7 flex items-center justify-between">
				<label for="rate" class="text-sm font-semibold text-navy">Interest rate (p.a.)</label>
				<span class="font-display text-lg font-extrabold text-primary">{rate.toFixed(2)}%</span>
			</div>
			<input id="rate" type="range" min="5" max="15" step="0.05" bind:value={rate} class="mt-3 w-full accent-primary" />
			<div class="mt-1 flex justify-between text-xs text-ink-soft"><span>5%</span><span>15%</span></div>

			<!-- Tenure -->
			<div class="mt-7 flex items-center justify-between">
				<label for="yrs" class="text-sm font-semibold text-navy">Tenure</label>
				<span class="font-display text-lg font-extrabold text-primary">{years} years</span>
			</div>
			<input id="yrs" type="range" min="1" max="30" step="1" bind:value={years} class="mt-3 w-full accent-primary" />
			<div class="mt-1 flex justify-between text-xs text-ink-soft"><span>1 yr</span><span>30 yrs</span></div>

			<div class="mt-8 rounded-2xl bg-gradient-to-br from-primary to-primary-deep p-6 text-white">
				<p class="text-sm text-white/80">Your monthly EMI</p>
				<p class="font-display text-4xl font-extrabold">{formatRupees(Math.round(emi))}</p>
			</div>
		</div>

		<!-- Breakdown -->
		<div class="rounded-2xl border border-outline-soft/60 bg-surface p-7 shadow-sm">
			<h2 class="font-display text-lg font-bold text-navy">Payment breakdown</h2>

			<div class="mt-4 grid place-items-center">
				<svg viewBox="0 0 180 180" class="size-44 -rotate-90">
					<circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-gold)" stroke-width="22" />
					<circle
						cx="90" cy="90" r={R} fill="none" stroke="var(--color-primary)" stroke-width="22"
						stroke-dasharray={`${principalDash} ${C}`} stroke-linecap="round"
						style="transition: stroke-dasharray 0.4s var(--ease-out-expo)"
					/>
				</svg>
				<div class="-mt-28 text-center">
					<p class="font-display text-2xl font-extrabold text-navy">{principalPct}%</p>
					<p class="text-xs text-ink-soft">principal</p>
				</div>
			</div>

			<div class="mt-24 space-y-3 text-sm">
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-2"><span class="size-3 rounded-full bg-primary"></span>Principal</span>
					<span class="font-semibold text-navy">{fmtCr(amount)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-2"><span class="size-3 rounded-full bg-gold"></span>Total interest</span>
					<span class="font-semibold text-navy">{fmtCr(totalInterest)}</span>
				</div>
				<div class="flex items-center justify-between border-t border-outline-soft/60 pt-3">
					<span class="font-semibold text-navy">Total payable</span>
					<span class="font-display font-extrabold text-primary">{fmtCr(totalPayment)}</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Loan partners -->
{#if data.partners.length}
	<section id="loans" class="container-px scroll-mt-24 py-12">
		<h2 class="font-display text-2xl font-extrabold text-navy">Compare home loan partners</h2>
		<p class="mt-2 text-ink-soft">Interest rates from leading lenders.</p>
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.partners as bank (bank.id)}
				<div class="rounded-2xl border border-outline-soft/60 bg-surface p-5">
					<div class="flex items-center gap-3">
						<span class="grid size-11 place-items-center rounded-xl bg-primary-container text-primary"><Landmark class="size-5" /></span>
						<p class="font-display font-bold text-navy">{bank.name}</p>
					</div>
					<div class="mt-4 grid grid-cols-3 gap-2 text-center">
						<div>
							<p class="font-display text-lg font-extrabold text-primary">{bank.interest}</p>
							<p class="text-xs text-ink-soft">Interest</p>
						</div>
						<div>
							<p class="font-display text-lg font-extrabold text-navy">{bank.processingFee}</p>
							<p class="text-xs text-ink-soft">Proc. fee</p>
						</div>
						<div>
							<p class="font-display text-lg font-extrabold text-navy">{bank.maxTenure}y</p>
							<p class="text-xs text-ink-soft">Max tenure</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}
