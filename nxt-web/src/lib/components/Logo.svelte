<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import BrandMark from '$lib/components/BrandMark.svelte';

	// tone = 'dark'  → navy wordmark, for light backgrounds (default)
	// tone = 'light' → white wordmark, for dark backgrounds (hero / navy panels)
	let {
		tone = 'dark',
		size = 36,
		class: cls
	}: { tone?: 'light' | 'dark'; size?: number; class?: string } = $props();

	const light = $derived(tone === 'light');
</script>

<span class={cn('flex items-center gap-2.5', cls)}>
	<BrandMark {size} class="transition-transform duration-500 ease-out-expo group-hover/logo:scale-105" />
	<span class="flex flex-col leading-none">
		<span class={cn('font-display text-base font-extrabold tracking-tight', light ? 'text-white' : 'text-navy')}>
			NxtGen<span class={light ? 'text-primary-bright' : 'text-primary'}>Properties</span>
		</span>
		<span
			class={cn(
				'mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]',
				light ? 'text-white/55' : 'text-ink-soft/70'
			)}
		>
			Real Estate
		</span>
	</span>
</span>
