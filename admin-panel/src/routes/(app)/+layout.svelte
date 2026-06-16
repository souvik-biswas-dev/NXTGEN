<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="flex min-h-screen">
  <Sidebar />
  <div class="min-w-0 flex-1">
    {@render children()}
  </div>
</div>
