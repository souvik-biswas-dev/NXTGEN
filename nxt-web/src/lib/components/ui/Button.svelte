<script lang="ts" module>
	export type ButtonVariant = 'primary' | 'gold' | 'navy' | 'outline' | 'ghost' | 'glass';
	export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		loading?: boolean;
		class?: string;
		children: Snippet;
	} & Partial<HTMLButtonAttributes & HTMLAnchorAttributes>;

	let {
		variant = 'primary',
		size = 'md',
		href,
		loading = false,
		class: cls,
		children,
		...rest
	}: Props = $props();

	const variants: Record<ButtonVariant, string> = {
		primary:
			'bg-primary text-primary-fg shadow-lg shadow-primary/25 hover:bg-primary-deep hover:shadow-primary/40',
		gold: 'bg-gold text-navy shadow-lg shadow-gold/30 hover:brightness-105',
		navy: 'bg-navy text-white hover:bg-navy-soft',
		outline: 'border border-outline-soft text-ink hover:border-primary hover:text-primary bg-transparent',
		ghost: 'text-ink hover:bg-card',
		glass: 'glass border border-white/40 text-navy hover:bg-white/80'
	};
	const sizes: Record<ButtonSize, string> = {
		sm: 'h-9 px-4 text-sm gap-1.5',
		md: 'h-11 px-6 text-sm gap-2',
		lg: 'h-13 px-8 text-base gap-2.5'
	};

	const base =
		'group relative inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
</script>

{#if href}
	<a {href} class={cn(base, variants[variant], sizes[size], cls)} {...rest}>
		{#if loading}<span class="mr-1 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{/if}
		{@render children()}
	</a>
{:else}
	<button class={cn(base, variants[variant], sizes[size], cls)} disabled={loading || rest.disabled} {...rest}>
		{#if loading}<span class="mr-1 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{/if}
		{@render children()}
	</button>
{/if}
