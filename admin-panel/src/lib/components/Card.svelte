<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: cls = '', children }: { class?: string; children: Snippet } = $props();
</script>

<div class="card p-5 {cls}">
  {@render children()}
</div>
