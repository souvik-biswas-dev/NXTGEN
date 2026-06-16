<script lang="ts">
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Row = { label: string; count: number };
  const max = (rows: Row[]) => Math.max(1, ...rows.map((r) => r.count));
</script>

<Topbar title="Analytics" subtitle="Platform insights" name={data.session?.name ?? 'Admin'} />

<div class="grid gap-6 p-6 lg:grid-cols-2">
  {#snippet bars(title: string, rows: Row[], color: string)}
    <Card>
      <h2 class="mb-4 font-bold text-white">{title}</h2>
      <div class="space-y-3">
        {#each rows as r}
          <div>
            <div class="mb-1 flex justify-between text-xs">
              <span class="capitalize text-slate-300">{r.label}</span>
              <span class="font-semibold text-slate-400">{r.count}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-ink">
              <div class="h-full rounded-full transition-all" style="width:{(r.count / max(rows)) * 100}%;background:{color}"></div>
            </div>
          </div>
        {/each}
        {#if rows.length === 0}<p class="text-sm text-slate-500">No data</p>{/if}
      </div>
    </Card>
  {/snippet}

  {@render bars('Users by role', data.usersByRole, '#38bdf8')}
  {@render bars('Active subscriptions by plan', data.subsByPlan, '#0F766E')}
  <div class="lg:col-span-2">
    {@render bars('Top cities by listings', data.propsByCity, '#D4A24C')}
  </div>
</div>
