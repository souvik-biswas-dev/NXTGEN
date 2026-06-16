<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Phone from '@lucide/svelte/icons/phone';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const columns = [
		{
			title: 'Explore',
			links: [
				{ label: 'Buy a home', href: '/properties?type=buy' },
				{ label: 'Rent a home', href: '/properties?type=rent' },
				{ label: 'New launches', href: '/projects' },
				{ label: 'Commercial', href: '/properties?category=commercial' }
			]
		},
		{
			title: 'Tools',
			links: [
				{ label: 'EMI calculator', href: '/tools/emi' },
				{ label: 'Market insights', href: '/insights' },
				{ label: 'Home loans', href: '/insights#loans' },
				{ label: 'Favorites', href: '/favorites' }
			]
		},
		{
			title: 'Company',
			links: [
				{ label: 'About us', href: '/#why' },
				{ label: 'For brokers', href: '/register' },
				{ label: 'Post a property', href: '/dashboard' },
				{ label: 'Contact', href: '/#contact' }
			]
		}
	];
	const year = new Date().getFullYear();
</script>

<footer id="contact" class="relative mt-24 overflow-hidden bg-navy text-white">
	<div
		class="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/30 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -bottom-40 right-0 size-96 rounded-full bg-gold/20 blur-3xl"
	></div>

	<div class="container-px relative grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
		<div>
			<Logo tone="light" size={40} />
			<p class="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
				India's next-generation property marketplace. Discover RERA-verified homes, connect directly
				with owners and brokers, and close smarter — all in one place.
			</p>

			<div class="mt-6 space-y-2.5 text-sm text-white/70">
				<a class="flex items-center gap-3 hover:text-white" href="tel:+911234567890">
					<Phone class="size-4 text-gold" /> +91 12345 67890
				</a>
				<a class="flex items-center gap-3 hover:text-white" href="mailto:support@nxtgenproperties.com">
					<Mail class="size-4 text-gold" /> support@nxtgenproperties.com
				</a>
				<p class="flex items-center gap-3">
					<MapPin class="size-4 text-gold" /> Mumbai · Bengaluru · Delhi NCR
				</p>
			</div>
		</div>

		<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1.4fr]">
			{#each columns as col (col.title)}
				<div>
					<h4 class="font-display text-sm font-bold uppercase tracking-wider text-white/90">
						{col.title}
					</h4>
					<ul class="mt-4 space-y-2.5">
						{#each col.links as link (link.label)}
							<li>
								<a class="text-sm text-white/65 transition hover:text-gold" href={link.href}>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}

			<div class="sm:col-span-2 lg:col-span-1">
				<h4 class="font-display text-sm font-bold uppercase tracking-wider text-white/90">
					Stay in the loop
				</h4>
				<p class="mt-4 text-sm text-white/65">New launches & price drops, straight to your inbox.</p>
				<form class="mt-4 flex gap-2" onsubmit={(e) => e.preventDefault()}>
					<Input
						type="email"
						placeholder="you@email.com"
						class="border-white/20 bg-white/10 text-white placeholder:text-white/40"
					/>
					<Button type="submit" variant="gold" size="md" class="shrink-0 px-4" aria-label="Subscribe">
						<ArrowRight class="size-4" />
					</Button>
				</form>
			</div>
		</div>
	</div>

	<div class="container-px relative flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/50 sm:flex-row">
		<p>© {year} NxtGenProperties. All rights reserved.</p>
		<div class="flex gap-5">
			<a href="/#" class="hover:text-white">Privacy</a>
			<a href="/#" class="hover:text-white">Terms</a>
			<a href="/#" class="hover:text-white">RERA Compliance</a>
		</div>
	</div>
</footer>
