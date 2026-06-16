<script lang="ts">
	import { onMount } from 'svelte';
	import Lenis from 'lenis';

	let { children } = $props();

	onMount(() => {
		// Respect reduced-motion preference — skip the inertia entirely.
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) return;

		const lenis = new Lenis({
			duration: 1.1,
			easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
			touchMultiplier: 1.6
		});

		// Expose globally so anchor links / buttons can call lenis.scrollTo().
		(window as unknown as { lenis: Lenis }).lenis = lenis;

		let raf = 0;
		function loop(time: number) {
			lenis.raf(time);
			raf = requestAnimationFrame(loop);
		}
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			lenis.destroy();
		};
	});
</script>

{@render children?.()}
