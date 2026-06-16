<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';
	import { cn } from '$lib/utils/cn';

	let {
		eyebrow,
		title,
		subtitle,
		align = 'left',
		light = false,
		children
	}: {
		eyebrow?: string;
		title: string;
		subtitle?: string;
		align?: 'left' | 'center';
		light?: boolean;
		children?: Snippet;
	} = $props();
</script>

<div
	use:reveal
	class={cn('flex flex-col gap-3', align === 'center' && 'items-center text-center')}
>
	{#if eyebrow}
		<span
			class={cn(
				'inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]',
				light ? 'text-gold' : 'text-primary'
			)}
		>
			<span class="h-px w-6 bg-current"></span>{eyebrow}
		</span>
	{/if}
	<h2 class={cn('font-display text-3xl font-extrabold sm:text-4xl', light ? 'text-white' : 'text-navy')}>
		{title}
	</h2>
	{#if subtitle}
		<p class={cn('max-w-xl text-base leading-relaxed', light ? 'text-white/70' : 'text-ink-soft')}>
			{subtitle}
		</p>
	{/if}
	{@render children?.()}
</div>
