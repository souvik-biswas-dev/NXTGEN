<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import { Database, Save } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<Topbar title="Platform Data" subtitle="App-wide dynamic content (JSON)" name={data.session?.name ?? 'Admin'} />

<div class="space-y-4 p-6">
  <div class="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
    <Database size={18} /> Changes here affect the mobile app immediately. Keep the JSON structure valid.
  </div>

  {#if form?.error}
    <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{form.error}</div>
  {/if}

  {#each data.items as item}
    <Card>
      <form method="POST" action="?/save" use:enhance>
        <div class="mb-2 flex items-center justify-between">
          <code class="rounded-lg bg-ink px-2.5 py-1 text-sm font-semibold text-gold">{item.key}</code>
          <button class="btn-primary px-3 py-1.5 text-xs"><Save size={14} /> Save</button>
        </div>
        <input type="hidden" name="key" value={item.key} />
        <textarea name="json" rows="8" spellcheck="false" class="input font-mono text-xs leading-relaxed">{item.json}</textarea>
        {#if form?.savedKey === item.key}<p class="mt-2 text-xs text-emerald-400">Saved ✓</p>{/if}
      </form>
    </Card>
  {/each}
  {#if data.items.length === 0}<Card><p class="py-8 text-center text-slate-500">No platform data — run the backend seed.</p></Card>{/if}
</div>
