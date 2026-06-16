<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from '$lib/components/Logo.svelte';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';

	let {
		title,
		subtitle,
		children
	}: { title: string; subtitle: string; children: Snippet } = $props();

	const points = ['RERA-verified listings', 'Chat directly with owners', 'Free to list & explore'];
</script>

<section class="grid min-h-screen lg:grid-cols-2">
	<!-- Brand panel -->
	<div class="relative hidden overflow-hidden bg-navy p-12 lg:flex lg:flex-col lg:justify-between">
		<div class="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-32 -left-10 size-96 rounded-full bg-gold/20 blur-3xl"></div>

		<a href="/" class="group/logo relative w-fit"><Logo tone="light" /></a>

		<div class="relative">
			<h2 class="font-display text-4xl font-extrabold leading-tight text-white">
				Your next home<br />is a search away.
			</h2>
			<ul class="mt-8 space-y-3">
				{#each points as point (point)}
					<li class="flex items-center gap-3 text-white/85">
						<span class="grid size-7 place-items-center rounded-full bg-primary"><BadgeCheck class="size-4 text-white" /></span>
						{point}
					</li>
				{/each}
			</ul>
		</div>

		<p class="relative text-sm text-white/50">© {new Date().getFullYear()} NxtGenProperties</p>
	</div>

	<!-- Form panel -->
	<div class="flex items-center justify-center px-6 py-24">
		<div class="w-full max-w-sm">
			<a href="/" class="mb-8 inline-block lg:hidden"><Logo /></a>
			<h1 class="font-display text-3xl font-extrabold text-navy">{title}</h1>
			<p class="mt-2 text-ink-soft">{subtitle}</p>
			<div class="mt-8">
				{@render children()}
			</div>
		</div>
	</div>
</section>
