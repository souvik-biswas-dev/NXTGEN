<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils/cn';
	import { auth } from '$lib/stores/auth.svelte';
	import { initials } from '$lib/utils/format';
	import Button from '$lib/components/ui/Button.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import Heart from '@lucide/svelte/icons/heart';

	const links = [
		{ href: '/properties?type=buy', label: 'Buy', match: '/properties' },
		{ href: '/properties?type=rent', label: 'Rent', match: '/properties' },
		{ href: '/projects', label: 'New Launches', match: '/projects' },
		{ href: '/tools/emi', label: 'EMI Calculator', match: '/tools' },
		{ href: '/insights', label: 'Insights', match: '/insights' }
	];

	// Routes whose top section is a dark navy hero — over those, the navbar sits
	// on a dark background and must render light text (until the user scrolls).
	const darkHeroRoutes = ['/', '/insights', '/projects'];

	let scrolled = $state(false);
	let open = $state(false);

	onMount(() => {
		const onScroll = () => (scrolled = window.scrollY > 24);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const isActive = (m: string) => page.url.pathname.startsWith(m);
	const overDarkHero = $derived(
		darkHeroRoutes.includes(page.url.pathname) || page.url.pathname.startsWith('/tools')
	);
	// Transparent + light text only while resting on a dark hero. Once scrolled,
	// or on any light-topped page, the navbar becomes a solid glass bar.
	const transparent = $derived(overDarkHero && !scrolled);
</script>

<header
	class={cn(
		'fixed inset-x-0 top-0 z-50 transition-all duration-500',
		transparent ? 'py-4' : 'glass border-b border-outline-soft/40 py-2.5 shadow-sm'
	)}
>
	<nav class="container-px flex items-center justify-between gap-4">
		<a href="/" class="group/logo shrink-0" aria-label="NxtGenProperties home">
			<Logo tone={transparent ? 'light' : 'dark'} />
		</a>

		<div class="hidden items-center gap-1 lg:flex">
			{#each links as l (l.href)}
				<a
					href={l.href}
					class={cn(
						'rounded-full px-4 py-2 text-sm font-medium transition-colors',
						transparent
							? isActive(l.match)
								? 'text-white'
								: 'text-white/70 hover:text-white'
							: isActive(l.match)
								? 'text-primary'
								: 'text-ink-soft hover:text-ink'
					)}
				>
					{l.label}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/favorites"
				class={cn(
					'hidden size-10 place-items-center rounded-full transition sm:grid',
					transparent
						? 'text-white/80 hover:bg-white/10 hover:text-white'
						: 'text-ink-soft hover:bg-card hover:text-primary'
				)}
				aria-label="Favorites"
			>
				<Heart class="size-5" />
			</a>

			{#if auth.signedIn}
				<a
					href="/dashboard"
					class={cn(
						'hidden items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold transition sm:flex',
						transparent
							? 'bg-white/10 text-white hover:bg-white/20'
							: 'bg-card text-navy hover:bg-surface-variant'
					)}
				>
					<span class="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">
						{initials(auth.name)}
					</span>
					{auth.name?.split(' ')[0] ?? 'Account'}
				</a>
			{:else}
				<a
					href="/login"
					class={cn(
						'hidden h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors sm:inline-flex',
						transparent ? 'text-white/90 hover:text-white' : 'text-ink hover:bg-card'
					)}
				>
					Sign in
				</a>
				<Button href="/properties" size="sm" class="hidden sm:inline-flex">Explore</Button>
			{/if}

			<button
				class={cn(
					'grid size-10 place-items-center rounded-full transition-colors lg:hidden',
					transparent ? 'text-white' : 'text-ink'
				)}
				onclick={() => (open = !open)}
				aria-label="Toggle menu"
			>
				{#if open}<X class="size-6" />{:else}<Menu class="size-6" />{/if}
			</button>
		</div>
	</nav>

	{#if open}
		<div class="glass container-px mt-2 flex flex-col gap-1 rounded-2xl py-4 lg:hidden">
			{#each links as l (l.href)}
				<a
					href={l.href}
					class="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-card"
					onclick={() => (open = false)}>{l.label}</a
				>
			{/each}
			<div class="mt-2 flex gap-2 px-2">
				{#if auth.signedIn}
					<Button href="/dashboard" class="flex-1" onclick={() => (open = false)}>Dashboard</Button>
				{:else}
					<Button href="/login" variant="outline" class="flex-1" onclick={() => (open = false)}>Sign in</Button>
					<Button href="/register" class="flex-1" onclick={() => (open = false)}>Join free</Button>
				{/if}
			</div>
		</div>
	{/if}
</header>
