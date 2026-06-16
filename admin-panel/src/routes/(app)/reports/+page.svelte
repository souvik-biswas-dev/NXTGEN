<script lang="ts">
  import { enhance } from '$app/forms';
  import Topbar from '$lib/components/Topbar.svelte';
  import Card from '$lib/components/Card.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import { formatDateTime } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const tone = (s: string) => (s === 'resolved' ? 'success' : s === 'dismissed' ? 'neutral' : s === 'reviewing' ? 'info' : 'warning');
</script>

<Topbar title="Reports" subtitle={`${data.items.filter((r) => r.status === 'open').length} open`} name={data.session?.name ?? 'Admin'} />

<div class="space-y-3 p-6">
  {#each data.items as r}
    <Card class="flex flex-wrap items-center gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-100">{r.property?.title ?? 'Property'}</span>
          <Badge tone="danger">{r.reason}</Badge>
        </div>
        <div class="text-xs text-slate-500">{r.property?.city ?? ''} · {formatDateTime(r.createdAt)}</div>
        {#if r.details}<p class="mt-1 text-sm text-slate-400">{r.details}</p>{/if}
      </div>
      <Badge tone={tone(r.status)}>{r.status}</Badge>
      {#if r.status === 'open' || r.status === 'reviewing'}
        <div class="flex gap-2">
          <form method="POST" action="?/setStatus" use:enhance>
            <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="resolved" />
            <button class="btn-primary px-3 py-1.5 text-xs">Resolve</button>
          </form>
          <form method="POST" action="?/setStatus" use:enhance>
            <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="dismissed" />
            <button class="btn-ghost px-3 py-1.5 text-xs">Dismiss</button>
          </form>
        </div>
      {/if}
    </Card>
  {/each}
  {#if data.items.length === 0}<Card><p class="py-8 text-center text-slate-500">No reports</p></Card>{/if}
</div>
