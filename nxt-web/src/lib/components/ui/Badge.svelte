<script lang="ts" module>
	export type BadgeTone = 'teal' | 'gold' | 'navy' | 'success' | 'neutral' | 'glass';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let {
		tone = 'teal',
		class: cls,
		children
	}: { tone?: BadgeTone; class?: string; children: Snippet } = $props();

	const tones: Record<BadgeTone, string> = {
		teal: 'bg-primary-container text-primary-deep',
		gold: 'bg-gold/15 text-[#8a6418]',
		navy: 'bg-navy text-white',
		success: 'bg-success/12 text-[#0a7a52]',
		neutral: 'bg-card text-ink-soft',
		glass: 'glass text-navy border border-white/50'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
		tones[tone],
		cls
	)}
>
	{@render children()}
</span>
