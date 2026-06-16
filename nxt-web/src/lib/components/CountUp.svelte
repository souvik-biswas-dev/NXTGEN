<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value,
		duration = 1600,
		decimals = 0,
		prefix = '',
		suffix = '',
		class: cls = ''
	}: {
		value: number;
		duration?: number;
		decimals?: number;
		prefix?: string;
		suffix?: string;
		class?: string;
	} = $props();

	let el: HTMLSpanElement;
	let display = $state('0');

	function render(n: number) {
		display = prefix + n.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix;
	}

	onMount(() => {
		render(0);
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) {
			render(value);
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries[0].isIntersecting) return;
				io.disconnect();
				const start = performance.now();
				const tick = (now: number) => {
					const p = Math.min(1, (now - start) / duration);
					const eased = 1 - Math.pow(1 - p, 3);
					render(value * eased);
					if (p < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			},
			{ threshold: 0.4 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<span bind:this={el} class={cls}>{display}</span>
