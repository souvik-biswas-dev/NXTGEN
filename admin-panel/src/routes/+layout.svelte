<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  // Lenis smooth scrolling (client-only).
  onMount(() => {
    let raf = 0;
    let destroy = () => {};
    (async () => {
      const Lenis = (await import('lenis')).default;
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      destroy = () => {
        cancelAnimationFrame(raf);
        lenis.destroy();
      };
    })();
    return () => destroy();
  });
</script>

{@render children()}
