<script lang="ts">
  import type { Snippet } from 'svelte';
  type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  let { tone = 'neutral', children }: { tone?: Tone; children: Snippet } = $props();

  const tones: Record<Tone, string> = {
    neutral: 'bg-slate-500/15 text-slate-300',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400',
    danger: 'bg-rose-500/15 text-rose-400',
    info: 'bg-sky-500/15 text-sky-400',
    gold: 'bg-gold/15 text-gold',
  };
</script>

<span class="chip {tones[tone]}">{@render children()}</span>
