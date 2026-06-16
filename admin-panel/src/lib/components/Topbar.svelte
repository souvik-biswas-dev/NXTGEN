<script lang="ts">
  import { LogOut } from 'lucide-svelte';
  let { title, subtitle, name }: { title: string; subtitle?: string; name: string } = $props();
</script>

<header class="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-ink/70 px-6 py-4 backdrop-blur">
  <div class="min-w-0 flex-1">
    <h1 class="truncate text-lg font-bold text-white">{title}</h1>
    {#if subtitle}<p class="truncate text-xs text-slate-400">{subtitle}</p>{/if}
  </div>
  <div class="flex items-center gap-3">
    <div class="text-right">
      <div class="text-sm font-semibold text-slate-200">{name}</div>
      <div class="text-[11px] text-slate-500">Administrator</div>
    </div>
    <form method="POST" action="/login?/logout">
      <button class="btn-ghost" title="Sign out" aria-label="Sign out">
        <LogOut size={16} />
      </button>
    </form>
  </div>
</header>
